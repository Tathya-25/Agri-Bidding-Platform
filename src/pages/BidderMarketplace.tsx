import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToOpenOrders, createBid } from '../services/api';
import { getBidderInsights } from '../services/ai';
import { WorkOrder } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { MapPin, Map, Calendar, Clock, Search, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export const BidderMarketplace = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [search, setSearch] = useState('');
  
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToOpenOrders((data) => {
      setOrders(data);
    });
    return () => unsubscribe();
  }, []);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedOrder || !bidAmount) return;
    setIsSubmitting(true);
    
    try {
      await createBid({
        workOrderId: selectedOrder.id,
        bidderId: user.uid,
        amount: parseFloat(bidAmount),
      });
      toast.success("Bid submitted successfully!");
      setSelectedOrder(null);
      setBidAmount('');
      setAiInsight(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit bid");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetInsight = async () => {
    if (!selectedOrder) return;
    setIsLoadingInsight(true);
    try {
      const insight = await getBidderInsights(
        selectedOrder.location,
        selectedOrder.cropType,
        selectedOrder.area,
        selectedOrder.stage
      );
      setAiInsight(insight);
    } catch (error) {
      toast.error("Failed to load AI insights");
    } finally {
      setIsLoadingInsight(false);
    }
  };

  const closeAndResetModal = () => {
    setSelectedOrder(null);
    setBidAmount('');
    setAiInsight(null);
  };

  const filteredOrders = orders.filter(o => 
    o.location.toLowerCase().includes(search.toLowerCase()) || 
    o.cropType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Bidder Marketplace</h1>
          <p className="text-neutral-500">Find agricultural work orders and submit competitive bids.</p>
        </div>
        <div className="w-full md:w-72 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
            placeholder="Search location or crop..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No open work orders</h3>
          <p className="text-neutral-500">Check back later for new agricultural jobs in your area.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center text-neutral-500">No results match your search.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm border border-neutral-200 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-neutral-900">{order.cropType} Work</h3>
                <span className="text-xs text-neutral-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(order.createdAt)}
                </span>
              </div>
              
              <div className="space-y-3 text-sm text-neutral-600 mb-6 flex-grow">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-neutral-400" />
                  <span>{order.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Map className="h-4 w-4 text-neutral-400" />
                  <span>{order.area} Acres/Hectares</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-neutral-400" />
                  <span>{order.stage} Stage</span>
                </div>
              </div>
              
              <Button onClick={() => setSelectedOrder(order)} className="w-full">
                Submit Bid
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal 
        isOpen={!!selectedOrder} 
        onClose={closeAndResetModal}
        title={`Submit Bid: ${selectedOrder?.cropType} Work`}
      >
        <form onSubmit={handleBidSubmit} className="space-y-6">
          <div className="bg-neutral-50 p-4 rounded-lg text-sm text-neutral-600 space-y-2 mb-4 border border-neutral-200">
            <p><strong>Location:</strong> {selectedOrder?.location}</p>
            <p><strong>Area:</strong> {selectedOrder?.area} Ac/Ha</p>
            <p><strong>Stage:</strong> {selectedOrder?.stage}</p>
          </div>
          
          <div className="bg-emerald-50/50 rounded-lg border border-emerald-100 p-4 mb-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-emerald-900 mb-1">AI Bidding Advisor</h4>
                {aiInsight ? (
                  <p className="text-sm text-emerald-800 leading-relaxed">{aiInsight}</p>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-emerald-700 border-emerald-200 hover:bg-emerald-100 bg-white"
                    onClick={handleGetInsight}
                    disabled={isLoadingInsight}
                  >
                    {isLoadingInsight ? 'Analyzing market data...' : 'Generate Market Insights'}
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Bid Amount (₹)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-neutral-500 sm:text-sm">₹</span>
              </div>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="block w-full pl-8 pr-3 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={closeAndResetModal}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Confirm Bid'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
