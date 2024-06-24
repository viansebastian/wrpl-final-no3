document.addEventListener('DOMContentLoaded', () => {
    getProducts();
});

async function getProducts() {
    try {
        const response = await axios.get('http://localhost:3000/products'); // Updated URL
        const products = response.data;
        const productsDiv = document.getElementById('products');
        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.innerHTML = `
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p>Price: Rp${product.price}</p>
                <input type="number" id="quantity-${product.product_id}" placeholder="Quantity">
                <button onclick="purchase(${product.product_id})">Purchase</button>
            `;
            productsDiv.appendChild(productCard);
        });
    } catch (error) {
        console.error(error);
    }
}

async function purchase(productId) {
    const quantity = document.getElementById(`quantity-${productId}`).value;

    try {
        const response = await axios.post('http://localhost:3000/purchase', { // Updated URL
            user_id: 1, // Replace with actual user_id after implementing authentication
            product_id: productId,
            quantity: quantity
        });
        alert('Purchase successful!');
    } catch (error) {
        console.error(error);
    }
}
