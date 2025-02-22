from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import torch
import pandas as pd
from pydantic import BaseModel
from typing import List
import torch.nn as nn
import uvicorn
import os

# Define the Neural Collaborative Filtering model with categories
class NCF_With_Categories(nn.Module):
    def __init__(self, n_users, n_items, n_categories, embedding_dim, layers):
        super(NCF_With_Categories, self).__init__()
        
        self.user_embedding = nn.Embedding(n_users, embedding_dim)
        self.item_embedding = nn.Embedding(n_items, embedding_dim)
        self.category_embedding = nn.Embedding(n_categories, embedding_dim)

        self.fc_layers = nn.ModuleList()
        for i in range(len(layers) - 1):
            self.fc_layers.append(nn.Linear(layers[i], layers[i+1]))

        self.output_layer = nn.Linear(layers[-1], 1)
        self.activation = nn.ReLU()

    def forward(self, user_input, item_input, category_input):
        user_embedded = self.user_embedding(user_input)
        item_embedded = self.item_embedding(item_input)
        category_embedded = self.category_embedding(category_input)

        x = torch.cat([user_embedded, item_embedded, category_embedded], dim=-1)

        for layer in self.fc_layers:
            x = self.activation(layer(x))

        output = self.output_layer(x)
        return output.squeeze()

# Load dataset to get products information
df = pd.read_csv("utils/products.csv")

# Load dataset to get user interactions
df_users = pd.read_csv("utils/interactions.csv")

# Drop rows with missing values
df_users = df_users.dropna()


num_users = df_users['user_id'].nunique()
num_items = df_users['product_id'].nunique()
num_categories = df_users['category_id'].nunique()

# Load the trained model
embedding_dim = 64
layers = [embedding_dim * 3, 128, 64, 32]

model = NCF_With_Categories(num_users, num_items, num_categories, embedding_dim, layers)
model.load_state_dict(torch.load("utils/ncf_model_with_categories.pth", map_location=torch.device("cpu")))
model.eval()

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000",  # Add your frontend URL here
    # Add other origins if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for request validation
class RecommendationRequest(BaseModel):
    user_id: int
    top_k: int = 10


class RecommendationResponse(BaseModel):
    product_id: int
    name: str
    image: str
    rating: float

class RecommendationResult(BaseModel):
    recommended_products: List[dict]
    user_purchases: List[RecommendationResponse]

@app.get("/")
def home():
    return {"message": "Recommendation System API is running!"}

"""
Endpoint to get product recommendations for a user.
Args:
    request (RecommendationRequest): The request object containing user_id and top_k.
Returns:
    dict: A dictionary containing recommended products and user purchases.
Raises:
    HTTPException: If the user ID is not found in the users DataFrame.
    HTTPException: If the user has not made any purchases.
    HTTPException: If no products are found for the user's preferred category.
"""
@app.post("/recommendations/", response_model=RecommendationResult)

def get_recommendations(request: RecommendationRequest):
    user_id = request.user_id
    top_k = request.top_k
    
    if user_id not in df_users['user_id'].values:
        raise HTTPException(status_code=404, detail="User ID not found")
    
    user_purchases = df[df["user_id"] == user_id]

    if user_purchases.empty:
        raise HTTPException(status_code=404, detail="El usuario no ha realizado compras.")

    purchases_list = [
        RecommendationResponse(
            product_id=int(row["product_id"]),
            name=row["name"],
            image=row["image"],
            rating=float(row["ratings"])
        ) for _, row in user_purchases.iterrows()
    ]

    # Get preferred category for the user
    preferred_category = df_users[df_users['user_id'] == user_id]['category_id'].mode()[0]
    category_filtered_df = df[df['category_id'] == preferred_category]

    if category_filtered_df.empty:
        raise HTTPException(status_code=404, detail="No products found for user's preferred category")

    product_ids = torch.tensor(category_filtered_df['product_id'].values, dtype=torch.long)

    with torch.no_grad():
        user_tensor = torch.full_like(product_ids, user_id)
        category_tensor = torch.full_like(product_ids, preferred_category)
        predictions = model(user_tensor, product_ids, category_tensor)

    # Get top-k recommendations
    top_indices = predictions.argsort(descending=True)[:top_k]
    recommended_products = category_filtered_df.iloc[top_indices.numpy()][['name', 'ratings', 'image']]

    response = {
        "recommended_products": recommended_products.to_dict(orient='records'),
        "user_purchases": purchases_list
    }

    return response

# Run with: uvicorn script_name:app --reload

if __name__ == "__main__":
    
    uvicorn.run(app, host="0.0.0.0", port=os.environ.get("PORT_BACKEND_RNA_APPLICATIONS", 3450))