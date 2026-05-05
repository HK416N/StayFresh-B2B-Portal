import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { getOrders } from "../services/orderService";
import { formatStatus } from "../utils/formatStatus";
import Navbar from "../components/Navbar";

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'Staff';

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  //fetch order history (COMPLETE + CANCELLED)
  useEffect(()=>{
    const fetchOrders = async () => {
      setIsLoading(true);
      const result = await getOrders(['COMPLETE', 'CANCELLED']);
      setIsLoading(false);
      
      if (!result.success) {
        setError(result.error);
        return;
      }
      
      setOrders(result.data);
      setError('');
    };
    
    fetchOrders();
  },[]);

  return(
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">Order History</h1>
        <Link to="/home" className="text-sm text-gray-600 hover:text-gray-900 mb-6 inline-flex items-center gap-1">
          Back to Home
        </Link>

        {/* Error state */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Loading / empty / data states */}
        {isLoading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No order history yet.</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-4">Order ID</th>
                  <th className="text-left p-4">Client</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-center p-4">View</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-gray-100">
                    <td className="p-4">{order.id}</td>
                    <td className="p-4">{order.company_name || '—'}</td>
                    <td className="p-4 text-right">${Number(order.total).toFixed(2)}</td>
                    <td className="p-4 font-medium tracking-wide">
                      {formatStatus(order.status)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className="text-green-700 hover:text-green-800"
                        title="View order"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>    
  );
};

export default OrderHistory;