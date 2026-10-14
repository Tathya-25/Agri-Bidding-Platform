import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createWorkOrder, subscribeToCustomerOrders, subscribeToWorkOrderBids, acceptBidTransaction } from '../services/api';
import { WorkOrder, Bid, CropStage } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Sprout, MapPin, Map, Calendar, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');
  const [cropType, setCropType] = useState('Wheat');
  const [stage, setStage] = useState<CropStage>('Pre-planting');

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToCustomerOrders(user.uid, (data) => {
      setOrders(data);
    });
    return () => unsubscribe();
  }, [user]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !location || !area) return;
    setIsSubmitting(true);
    try {
      await createWorkOrder({
        customerId: user.uid,
        location,
        area: parseFloat(area),
        cropType,
        stage,
      });
      toast.success("Work order created successfully!");
      setLocation('');
      setArea('');
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Customer Dashboard</h1>
        <p className="text-neutral-500">Post new work orders and manage incoming bids.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 sticky top-24">
            <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
              <Sprout className="h-5 w-5 text-emerald-600" />
              Create Work Order
            </h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <Input
                label="Location"
                placeholder="e.g., Punjab, Maharashtra"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
              <Input
                label="Area (Acres/Hectares)"
                type="number"
                step="0.1"
                placeholder="0.0"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Crop Type</label>
                <select
                  value={cropType}
                  onChange={(e) => setCropType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option>Wheat</option>
                  <option>Rice</option>
                  <option>Sugarcane</option>
                  <option>Cotton</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Stage of Crop</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as CropStage)}
                  className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option>Pre-planting</option>
                  <option>Vegetative</option>
                  <option>Flowering</option>
                  <option>Harvesting</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Work Order'}
              </Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-neutral-900 mb-4">Your Active Orders</h2>
          {orders.length === 0 ? (
            <div className="p-8 text-center bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
              <p className="text-neutral-500">No work orders posted yet.</p>
            </div>
          ) : (
            orders.map(order => (
              <WorkOrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const WorkOrderCard = ({ order }: { order: WorkOrder }) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (isExpanded && order.status === 'open') {
      const unsubscribe = subscribeToWorkOrderBids(order.id, setBids);
      return () => unsubscribe();
    }
  }, [isExpanded, order.id, order.status]);

  const handleAcceptBid = async (bidId: string) => {
    if (confirm("Are you sure you want to accept this bid? All other bids will be rejected.")) {
      setIsAccepting(true);
      try {
        await acceptBidTransaction(order.id, bidId);
        toast.success("Bid accepted successfully!");
      } catch (err: any) {
        toast.error(err.message || "Failed to accept bid");
      } finally {
        setIsAccepting(false);
      }
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-colors ${order.status === 'assigned' ? 'border-emerald-200 bg-emerald-50/30' : 'border-neutral-200'}`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${order.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {order.status.toUpperCase()}
            </span>
            <h3 className="mt-2 text-lg font-bold text-neutral-900">{order.cropType} Work</h3>
          </div>
          <span className="text-xs text-neutral-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(order.createdAt)} ago
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
          <div className="flex flex-col">
            <span className="text-neutral-500 flex items-center gap-1 mb-1"><MapPin className="h-4 w-4" /> Location</span>
            <span className="font-medium">{order.location}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-neutral-500 flex items-center gap-1 mb-1"><Map className="h-4 w-4" /> Area</span>
            <span className="font-medium">{order.area} {order.area === 1 ? 'Ac/Ha' : 'Ac/Ha'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-neutral-500 flex items-center gap-1 mb-1"><Calendar className="h-4 w-4" /> Stage</span>
            <span className="font-medium">{order.stage}</span>
          </div>
        </div>
      </div>
      
      {order.status === 'open' && (
        <div className="border-t border-neutral-100">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-emerald-700 bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            View Bids
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {isExpanded && (
            <div className="p-5 bg-neutral-50 divide-y divide-neutral-200">
              {bids.length === 0 ? (
                <p className="text-sm text-neutral-500 py-2 text-center">No bids received yet.</p>
              ) : (
                bids.map(bid => (
                  <div key={bid.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                    <div>
                      <p className="font-bold text-neutral-900 text-lg">₹{bid.amount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-neutral-500">{formatDistanceToNow(bid.createdAt)} ago • Bidder: {bid.bidderId.substring(0,6)}...</p>
                    </div>
                    {bid.status === 'pending' && (
                       <Button size="sm" onClick={() => handleAcceptBid(bid.id)} disabled={isAccepting}>
                         Accept Bid
                       </Button>
                    )}
                    {bid.status === 'accepted' && (
                      <span className="text-emerald-600 font-medium flex items-center gap-1 text-sm"><CheckCircle className="h-4 w-4" /> Accepted</span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
      
      {order.status === 'assigned' && (
        <div className="px-5 py-3 bg-emerald-50 border-t border-emerald-100 text-sm text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle className="h-4 w-4" />
          Work order assigned to a bidder.
        </div>
      )}
    </div>
  );
};
