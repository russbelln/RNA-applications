import React, { useState } from 'react';
import { Modal, Button, Input, Form, Pagination, Rate, Card } from 'antd';
import fetchData from '../services/Api';
import './ScorePage.css'; // Importa el archivo CSS

const { Meta } = Card;

const ScorePage = () => {
  const [userId, setUserId] = useState('');
  const [topK, setTopK] = useState(10);
  const [recommendations, setRecommendations] = useState([]);
  const [userPurchases, setUserPurchases] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const handleFormSubmit = () => {
    // Enviar datos al backend para obtener recomendaciones
    fetchData.post('/recommendations', { user_id: userId, top_k: topK })
      .then((response) => {
        setRecommendations(response.data.recommended_products);
        setUserPurchases(response.data.user_purchases);
        setIsModalVisible(true); // Mostrar el modal cuando se reciban las recomendaciones
      })
      .catch((error) => console.error('Error fetching recommendations:', error));
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const handleImageError = (e) => {
    e.target.src = 'https://ih1.redbubble.net/image.4905811447.8675/flat,750x,075,f-pad,750x1000,f8f8f8.jpg'; // Ruta de la imagen por defecto
  };

  const paginatedRecommendations = recommendations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <h1 className="score-page-header">Recommender</h1>
      <Form layout="inline" onFinish={handleFormSubmit}>
        <Form.Item label="User ID">
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} />
        </Form.Item>
        <Form.Item label="Top K">
          <Input type="number" value={topK} onChange={(e) => setTopK(e.target.value)} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Get Recommendations</Button>
        </Form.Item>
      </Form>
      <Modal
        title="Previous Purchases and Recommendations"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="ok" type="primary" onClick={handleOk}>
            OK
          </Button>,
        ]}
        width={800} // Ajusta el ancho del modal
      >
        <h2>Previous Purchases</h2>
        <div className="product-grid">
          {userPurchases.map((purchase) => (
            <Card
              key={purchase.product_id}
              hoverable
              cover={<img alt={purchase.name} src={purchase.image} onError={handleImageError} />}
            >
              <Meta title={purchase.name} description={<Rate disabled value={parseFloat(purchase.ratings)} />} />
            </Card>
          ))}
        </div>
        <h2>Recommendations</h2>
        <div className="product-grid">
          {paginatedRecommendations.map((product) => (
            <Card
              key={product.product_id}
              hoverable
              cover={<img alt={product.name} src={product.image} onError={handleImageError} />}
            >
              <Meta title={product.name} description={<Rate disabled value={parseFloat(product.ratings)} />} />
            </Card>
          ))}
        </div>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={recommendations.length}
          onChange={handlePageChange}
          showSizeChanger
          pageSizeOptions={['1', '2', '5']}
        />
      </Modal>
    </div>
  );
};

export default ScorePage;