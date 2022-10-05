import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [loading, setLoading] = useState(false);
  const [orderAmount, setOrderAmount] = useState(false);
  const [orders, setOrders] = useState([]);

  async function fetchOrders() {
    console.log("in list order");
    const { data } = await axios.get("http://localhost:8080/list-orders");
    console.log(data);
    setOrders(data);
  }
  useEffect(() => {
    fetchOrders();
  }, []);

  const loadRazorpay = () => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onerror = () => {
      alert("Razorpay SDK failed to load. Are you online?");
    };
    script.onload = async () => {
      try {
        setLoading(true);
        const result = await axios.post("http://localhost:8080/create-order", {
          amount: orderAmount + "00",
        });
        const { amount, id: order_id, currency } = result.data;
        const {
          data: { key: razorpayKey },
        } = await axios.get("http://localhost:8080/get-razorpay-key");
        console.log("razorpayKey", razorpayKey);
        const options = {
          key: razorpayKey,
          amount: amount.toString(),
          currency: currency,
          name: "example name",
          description: "example transaction",
          order_id: order_id,
          handler: async function (response) {
            const result = await axios.post("http://localhost:8080/pay-order", {
              amount: amount,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            alert(result.data.msg);
            fetchOrders();
          },
          prefill: {
            name: "example name",
            email: "email@example.com",
            contact: "9898989898",
          },
          notes: {
            address: "Masai",
          },
          theme: {
            color: "#80c0f0",
          },
        };

        setLoading(false);
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } catch (err) {
        alert(err);
        setLoading(false);
      }
    };
    document.body.appendChild(script);
  };

  return (
    <div className="App">
      <h1>Razorpay</h1>

      <input
        type="number"
        value={orderAmount}
        onChange={(e) => setOrderAmount(e.target.value)}
      />
      <button disabled={loading} onClick={loadRazorpay}>
        Pay
      </button>
      {loading && <h3>Loading....</h3>}
      <div className="list-orders">
        <h2>List Orders</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>AMOUNT</th>
              <th>ISPAID</th>
              <th>RAZORPAY</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((x) => (
              <tr key={x._id}>
                <td>{x._id}</td>
                <td>{x.amount / 100}</td>
                <td>{x.isPaid ? "YES" : "NO"}</td>
                <td>{x.razorpay.paymentId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
