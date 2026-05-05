import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getOrderById, updateOrderStatus } from '../services/orderService';
import { formatStatus } from '../utils/formatStatus';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin = user?.role === 'Staff'

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    const result = await getOrderById(id);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    };

    setOrder(result.data);
    setError('');
  }

  useEffect(() => {
    fetchOrder();
  }, [id]);

  //status change handler used by all 3 admin buttons + customers cancel
  const changeStatus = async (newStatus) => {
    setSubmitting(true);
    const result = await updateOrderStatus(id, newStatus);
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(`Order ${newStatus.toLowerCase()}`);
    fetchOrder();
  };

  const handleConfirmCancel = () => {
    setConfirmCancelOpen(false);
    changeStatus('CANCELLED');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center text-gray-500 py-12">Loading...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3x1 mx-auto px-6 py-8">
          <Link to="/orders" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center gap-1">
            Orders
          </Link>
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm mt-4">
            {error || 'Order not found'}
          </div>
        </div>
      </div>
    );
  }

  const showCustomerCancel =
    !isAdmin && (order.status === 'PLACED' || order.status === 'TRANSIT');

  const showAdminButtons =
    isAdmin && (order.status === 'PLACED' || order.status === 'TRANSIT');

  // decided to go with same heading instead of 2 different headings for different users.
  const heading = `Order #${order.id} Details`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          {heading}
        </h1>
        <Link to="/orders" className="text-sm text-gray-600 hover:text-gray-900 mb-6 inline-flex items-center gap-1">
          Back to Orders
        </Link>

        <div className="bg-blue-50/30 border border-gray-200 rounded-lg p-6 mt-4">
          {/* Status display */}
          <div className="flex justify-between items-center mb-4">
            {isAdmin && order.company_name && (
              <span className="text-sm text-gray-600">
                Client:
                <span className="font-medium text-gray-900">
                  {order.company_name}
                </span>
              </span>
            )}
            <span className="text-sm font-medium tracking-wide text-gray-700 ml-auto">
              Status: {formatStatus(order.status)}
            </span>
          </div>

          {/* Items table */}
          <table className="w-full text-sm">
            <thead className="text-gray-700">
              <tr>
                <th className="text-left p-3">Item</th>
                <th className="text-left p-3">QTY</th>
                <th className="text-right p-3">Price</th>
                <th className="text-right p-3">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-t border-gray-200">
                  <td className="p-3">{item.description}</td>
                  <td className="p-3">{item.quantity} {item.uom}</td>
                  <td className="p-3 text-right">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="p-3 text-right">
                    ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Total */}
          <div className="flex justify-end items-center gap-4 mt-6 pt-4 border-t border-gray-200">
            <span className="text-base font-semibold text-gray-900">
              Total :
            </span>
            <span className="text-base font-semibold text-gray-900">
              $ {Number(order.total).toFixed(2)}
            </span>
          </div>

          {/* Action buttons based on role and status
          customers can only CANCEL*/}
          {showCustomerCancel && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setConfirmCancelOpen(true)}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-2 rounded-md disabled:opacity-50"
              >
                Cancel Order
              </button>
            </div>
          )}

          {/* Admins can CANCEL + transition PLACED-TRANSIT TRANSIT-COMPLETE*/}
          {showAdminButtons && (
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setConfirmCancelOpen(true)}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-md disabled:opacity-50"
              >
                Cancel Order
              </button>

              {order.status === 'PLACED' && (
                <button
                  onClick={() => changeStatus('TRANSIT')}
                  disabled={submitting}
                  className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-medium px-6 py-2 rounded-md disabled:opacity-50"
                >
                  Out for Delivery
                </button>
              )}

              {order.status === 'TRANSIT' && (
                <button
                  onClick={() => changeStatus('COMPLETE')}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-md disabled:opacity-50"
                >
                  Delivered
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmCancelOpen}
        title={`Cancel Order #${order.id}?`}
        message="Stock will be restored for any items in this order. This action cannot be undone."
        confirmLabel="Yes, cancel order"
        destructive={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </div>
  );
};

export default OrderDetail;

