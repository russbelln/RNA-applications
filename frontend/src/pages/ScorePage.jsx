import React, { useState } from 'react';
import { Modal, Button, Input, Form, Pagination, Rate, Card, Tooltip, List } from 'antd';
import fetchData from '../services/Api';
import './ScorePage.css'; // Importa el archivo CSS
import userIds from '../data/users-id.json'; // Importa el archivo JSON

const { Meta } = Card;

const ScorePage = () => {
  const [userId, setUserId] = useState('');
  const [topK, setTopK] = useState(10);
  const [recommendations, setRecommendations] = useState([]);
  const [userPurchases, setUserPurchases] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUserIdsModalVisible, setIsUserIdsModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [userIdsPage, setUserIdsPage] = useState(1);
  const [userIdsPageSize, setUserIdsPageSize] = useState(10);

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

  const handleUserIdsModalOk = () => {
    setIsUserIdsModalVisible(false);
  };

  const handleUserIdsModalCancel = () => {
    setIsUserIdsModalVisible(false);
  };

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const handleUserIdsPageChange = (page, pageSize) => {
    setUserIdsPage(page);
    setUserIdsPageSize(pageSize);
  };

  const handleImageError = (e) => {
    e.target.src = 'https://ih1.redbubble.net/image.4905811447.8675/flat,750x,075,f-pad,750x1000,f8f8f8.jpg'; // Ruta de la imagen por defecto
  };

  const paginatedRecommendations = recommendations.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedUserIds = userIds.slice((userIdsPage - 1) * userIdsPageSize, userIdsPage * userIdsPageSize);

  return (
    <div>
      <h1 className="score-page-header">Recommender</h1>
      <Form layout="inline" onFinish={handleFormSubmit}>
        <Form.Item label={
          <Tooltip title="Enter the User ID for which you want recommendations">
            <span className="form-label">User ID</span>
          </Tooltip>
        }>
          <Input value={userId} onChange={(e) => setUserId(e.target.value)} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={() => setIsUserIdsModalVisible(true)}>Show User IDs</Button>
        </Form.Item>
        <Form.Item label={
          <Tooltip title="Enter the number of top recommendations to retrieve">
            <span className="form-label">Top K</span>
          </Tooltip>
        }>
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
      <Modal
        title="User IDs"
        visible={isUserIdsModalVisible}
        onOk={handleUserIdsModalOk}
        onCancel={handleUserIdsModalCancel}
        footer={[
          <Button key="ok" type="primary" onClick={handleUserIdsModalOk}>
            OK
          </Button>,
        ]}
        width={700} // Ajusta el ancho del modal
      >
        <List
          dataSource={paginatedUserIds}
          renderItem={item => (
            <List.Item>
              {item.user_id}
            </List.Item>
          )}
        />
        <Pagination
          current={userIdsPage}
          pageSize={userIdsPageSize}
          total={userIds.length}
          onChange={handleUserIdsPageChange}
          showSizeChanger
          pageSizeOptions={['5', '10', '20']}
        />
      </Modal>
    </div>
  );
};

export default ScorePage;