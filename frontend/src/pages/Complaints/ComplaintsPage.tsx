import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { ThumbsUp, MapPin, FileText, AlertCircle, Plus, CheckCircle, Clock } from 'lucide-react';

interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
  latitude: number;
  longitude: number;
  address: string;
  upvotes: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  citizen: { name: string };
}

const ComplaintsPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date or priority

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('POTHOLE');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    // Fetch user location for complaint
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, [showForm]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const url = `/api/complaints?category=${categoryFilter}&sortBy=${sortBy}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setComplaints(data);
      }
    } catch (err) {
      setComplaints([
        {
          id: 'complaint-1',
          title: 'Deep Pothole near Western Express Highway',
          description: 'A large, deep pothole has formed in the middle lane of WEH near Bandra exit, causing traffic delays and posing hazards to bikes.',
          category: 'POTHOLE',
          status: 'PENDING',
          latitude: 19.0544,
          longitude: 72.8401,
          address: 'WEH Near Bandra Exit, Mumbai',
          upvotes: 18,
          priority: 'HIGH',
          createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
          citizen: { name: 'Vikram Shinde' },
        },
        {
          id: 'complaint-2',
          title: 'Overflowing Municipal Garbage Bin',
          description: 'Litter bin has not been cleared for 3 days. Trash is spilling onto the footpath, causing bad smell and pest issues.',
          category: 'GARBAGE',
          status: 'IN_PROGRESS',
          latitude: 19.0621,
          longitude: 72.8354,
          address: 'Linking Road, Opp KFC, Bandra West',
          upvotes: 32,
          priority: 'MEDIUM',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          citizen: { name: 'Neha Deshmukh' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [categoryFilter, sortBy]);

  const handleUpvote = async (id: string) => {
    if (!isAuthenticated) return alert('Please sign in to support this report.');
    try {
      const response = await fetch(`/api/complaints/${id}/upvote`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('ch_token') || ''}`,
        },
      });
      if (response.ok) {
        setComplaints((prev) =>
          prev.map((c) => (c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return alert('Please login to report a grievance.');

    setSubmitting(true);
    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('ch_token') || ''}`,
        },
        body: JSON.stringify({
          title,
          description: desc,
          category,
          latitude: coords?.lat || 18.5204,
          longitude: coords?.lng || 73.8567,
          address,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setTitle('');
        setDesc('');
        setAddress('');
        setTimeout(() => {
          setSubmitSuccess(false);
          setShowForm(false);
        }, 3000);
        fetchComplaints();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-500 text-white';
      case 'HIGH':
        return 'bg-orange-500 text-white';
      case 'MEDIUM':
        return 'bg-yellow-500 text-slate-800';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Civic Grievance Board</h1>
          <p className="text-slate-500 text-sm mt-1">
            Report local issues like potholes, open garbage dumps, or broken streetlights. Upvote verified complaints to increase municipal priority.
          </p>
        </div>
        <button
          onClick={() => {
            if (!isAuthenticated) return navigate('/login');
            setShowForm(!showForm);
          }}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md3 font-semibold shadow-sm flex items-center gap-1.5 hover-scale"
        >
          <Plus className="w-5 h-5" />
          {showForm ? 'Cancel Report' : 'Report New Issue'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Submit Grievance Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-1.5">
              <FileText className="w-5 h-5 text-primary" />
              File Local Issue
            </h3>

            {submitSuccess ? (
              <div className="bg-green-50 border border-green-200 p-4 rounded-md3 text-primary-dark text-sm flex flex-col items-center gap-2">
                <CheckCircle className="w-10 h-10 text-primary animate-bounce" />
                <span className="font-semibold">Issue Submitted Successfully!</span>
                <span className="text-xs text-slate-500">Redirecting to board...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Issue Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-md3 border border-slate-border outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Broken Streetlight on SV Road"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-md3 border border-slate-border bg-white outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="POTHOLE">Pothole / Road Damage</option>
                    <option value="GARBAGE">Garbage Accumulation</option>
                    <option value="WATER_LEAK">Water Leakage</option>
                    <option value="STREETLIGHT">Broken Streetlight</option>
                    <option value="ILLEGAL_DUMPING">Illegal Dumping</option>
                    <option value="PUBLIC_TOILET">Public Toilet Hazard</option>
                    <option value="OTHER">Other Issues</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Location Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 rounded-md3 border border-slate-border outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. SVM Road, Opp GPO, Bandra West"
                    required
                  />
                  {coords && (
                    <span className="text-xs text-green-600 font-semibold block pt-1">
                      ✓ GPS coordinates locked: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Description details</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 rounded-md3 border border-slate-border outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Provide details to assist municipal crew..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-md3 font-semibold shadow-sm transition-all"
                >
                  {submitting ? 'Submitting Grievance...' : 'Submit Grievance'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Right Column: Complaints List board */}
        <div className={showForm ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 space-y-4'}>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-md3 border border-slate-border shadow-sm flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded bg-slate-50 border border-slate-border text-sm font-semibold text-slate-600 outline-none"
              >
                <option value="">All Categories</option>
                <option value="POTHOLE">Potholes</option>
                <option value="GARBAGE">Garbage</option>
                <option value="WATER_LEAK">Water Leakage</option>
                <option value="STREETLIGHT">Streetlights</option>
                <option value="ILLEGAL_DUMPING">Illegal Dumping</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 rounded bg-slate-50 border border-slate-border text-sm font-semibold text-slate-600 outline-none"
              >
                <option value="date">Sort: Newest</option>
                <option value="priority">Sort: Priority Score</option>
              </select>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{complaints.length} Grievances Cataloged</span>
          </div>

          {/* Grievances Feed */}
          {loading ? (
            <div className="flex justify-center items-center py-16 bg-white rounded-md3 border border-slate-border">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white text-center p-12 rounded-md3 border border-slate-border flex flex-col items-center justify-center">
              <AlertCircle className="w-16 h-16 text-slate-300 mb-4" />
              <p className="font-bold text-slate-600">No Complaints Reported</p>
              <p className="text-slate-400 text-sm mt-1">Be the first to file a civic issue in this area.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="bg-white p-6 rounded-md3 border border-slate-border shadow-sm flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {complaint.category}
                      </span>
                      <span className={`text-xs font-bold border px-2 py-0.5 rounded ${getStatusBadgeColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <span className={`text-xs font-extrabold px-2 py-0.5 rounded ${getPriorityBadgeColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-800">{complaint.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{complaint.description}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {complaint.address}
                      </span>
                      <span>•</span>
                      <span>By: {complaint.citizen?.name || 'Anonymous'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {new Date(complaint.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => handleUpvote(complaint.id)}
                      className="flex items-center gap-1.5 border border-slate-border hover:bg-primary-light hover:text-primary px-4 py-2 rounded-md3 text-sm font-semibold transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      Support ({complaint.upvotes})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintsPage;
