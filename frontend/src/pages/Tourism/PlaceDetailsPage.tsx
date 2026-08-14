import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import {
  Compass,
  MapPin,
  Star,
  Navigation,
  Share2,
  Heart,
  AlertTriangle,
  Clock,
  DollarSign,
  Calendar,
  ShieldAlert,
  Phone,
  Globe,
  CheckCircle2,
  HeartPulse,
  Building2,
  Send,
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
} from 'lucide-react';
import { fetchPlaceDetails, submitPlaceReview, TouristPlace, PlaceReview } from '../../services/tourismService.ts';
import { DirectionsModal } from '../../components/tourism/DirectionsModal.tsx';
import { ReportPlaceModal } from '../../components/tourism/ReportPlaceModal.tsx';
import { haversineDistance } from '../../services/locationService.ts';

export const PlaceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { latitude, longitude, ward, city, district } = useLocation();
  const { user, isAuthenticated } = useAuth();

  const userLat = latitude || 18.5204;
  const userLng = longitude || 73.8567;

  const [place, setPlace] = useState<TouristPlace | null>(null);
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [breakdown, setBreakdown] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Review Form
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [postingReview, setPostingReview] = useState(false);

  // Modals
  const [showDirections, setShowDirections] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!id) return;
    const loadDetails = async () => {
      setLoading(true);
      const res = await fetchPlaceDetails(id);
      if (res) {
        setPlace(res.place);
        setReviews(res.reviews);
        setBreakdown(res.ratingBreakdown);
      }
      setLoading(false);
    };
    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-xl font-bold text-slate-800">Place details not found.</div>
        <button
          onClick={() => navigate('/tourism')}
          className="px-4 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs"
        >
          Back to Tourism Discovery
        </button>
      </div>
    );
  }

  const distFromUser = haversineDistance(userLat, userLng, place.latitude, place.longitude);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: `${place.name} in ${place.district}, Maharashtra. Discover on MahaResilience!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Place link copied to clipboard!');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return alert('Please sign in to write a review.');
    if (!userComment.trim()) return;

    setPostingReview(true);
    const res = await submitPlaceReview(place.id, {
      rating: userRating,
      comment: userComment.trim(),
      userId: user?.id,
      userName: user?.name,
    });

    if (res.success && res.reviews) {
      setReviews(res.reviews);
      setUserComment('');
    }
    setPostingReview(false);
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn max-w-5xl mx-auto">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/tourism')}
          className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tourism Discovery
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`p-2.5 rounded-xl border transition-all ${
              isSaved
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Save to Favorites"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all"
            title="Share Place"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Cover Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="relative h-72 sm:h-96 w-full bg-slate-900 overflow-hidden">
          <img
            src={
              place.images?.[0] ||
              'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80'
            }
            alt={place.name}
            className="w-full h-full object-cover opacity-90"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          <div className="absolute bottom-6 left-6 right-6 space-y-2 text-white">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-teal-600 text-white font-extrabold text-[10px] uppercase rounded-full tracking-wider shadow-sm">
                {place.category}
              </span>
              {place.verified && (
                <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-[10px] rounded-full flex items-center gap-1">
                  ✓ Verified Platform Place
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{place.name}</h1>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-200 flex-wrap">
              <span>📍 {place.address}</span>
              <span>•</span>
              <span className="text-teal-300 font-bold">📍 {distFromUser} km from your location</span>
            </div>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-500 font-extrabold text-sm">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            <span>{place.ratingAvg}</span>
            <span className="text-slate-500 font-normal text-xs">({place.reviewCount} Reviews)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDirections(true)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Navigation className="w-4 h-4" /> Get Directions
            </button>

            <button
              onClick={() => setShowReport(true)}
              className="px-3.5 py-2.5 bg-white hover:bg-red-50 text-red-600 font-bold rounded-xl text-xs border border-red-200 transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" /> Report
            </button>
          </div>
        </div>
      </div>

      {/* Details Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Overview & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3">
              About & Significance
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{place.description}</p>

            {place.facilities && place.facilities.length > 0 && (
              <div className="pt-2">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-2">
                  Available Facilities
                </h4>
                <div className="flex flex-wrap gap-2">
                  {place.facilities.map((fac, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 border border-slate-200"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> {fac}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {place.safetyInfo && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1 text-amber-900 text-xs">
                <div className="font-extrabold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Safety Information & Precautions
                </div>
                <p className="text-amber-800 leading-relaxed">{place.safetyInfo}</p>
              </div>
            )}
          </div>

          {/* Photo Gallery */}
          {place.images && place.images.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-800 text-base">Photo Gallery</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {place.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="Gallery"
                    className="w-full h-32 object-cover rounded-2xl border border-slate-200 shadow-2xs hover:scale-105 transition-transform"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Community Ratings & Reviews */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" /> Community Reviews & Ratings
            </h3>

            {/* Ratings Histogram */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center sm:border-r border-slate-200 sm:pr-6">
                <div className="text-4xl font-black text-slate-800">{place.ratingAvg}</div>
                <div className="flex text-amber-400 justify-center my-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <div className="text-xs text-slate-500 font-bold">{place.reviewCount} Total Ratings</div>
              </div>

              <div className="flex-1 w-full space-y-1.5 text-xs font-bold text-slate-600">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = breakdown[star] || 0;
                  const percent = Math.min(100, Math.round((count / (place.reviewCount || 1)) * 100));
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-6 text-right font-mono">{star}★</span>
                      <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-slate-400 text-[11px] font-mono">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Write a Review Form */}
            <form onSubmit={handleReviewSubmit} className="space-y-3 pt-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Leave a Star Rating</h4>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= userRating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Share your travel experience, best time of day, crowd levels..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
              />

              <button
                type="submit"
                disabled={postingReview}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Send className="w-4 h-4" /> Post Review
              </button>
            </form>

            {/* Reviews List */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-slate-800 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-bold">
                        {rev.userName.charAt(0)}
                      </div>
                      <span>{rev.userName}</span>
                    </div>

                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-slate-600 leading-relaxed pt-1">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Key Info & Nearby Emergency/Public Services */}
        <div className="space-y-6">
          {/* Key Quick Info */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold text-slate-700">
            <h3 className="font-extrabold text-slate-800 text-base border-b border-slate-100 pb-3">
              Essential Visitor Info
            </h3>

            {place.openingHours && (
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Opening Hours</div>
                  <div className="text-slate-800 font-bold">{place.openingHours}</div>
                </div>
              </div>
            )}

            {place.entryFee && (
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Entry Fee</div>
                  <div className="text-slate-800 font-bold">{place.entryFee}</div>
                </div>
              </div>
            )}

            {place.bestTimeToVisit && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Best Time to Visit</div>
                  <div className="text-slate-800 font-bold">{place.bestTimeToVisit}</div>
                </div>
              </div>
            )}

            {place.contactNumber && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase text-slate-400 font-bold">Helpline</div>
                  <div className="text-slate-800 font-bold">{place.contactNumber}</div>
                </div>
              </div>
            )}
          </div>

          {/* Nearby Emergency & Public Services Integration */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" /> Nearby Emergency & Public Services
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <div>
                    <div className="font-bold text-red-900">Emergency Response</div>
                    <div className="text-[10px] text-red-700">Dial 112 / 108</div>
                  </div>
                </div>
                <span className="font-mono text-red-700 font-bold">📍 0 km</span>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-teal-600" />
                  <div>
                    <div className="font-bold text-teal-900">{district} District Hospital</div>
                    <div className="text-[10px] text-teal-700">24x7 Casualty Unit</div>
                  </div>
                </div>
                <span className="font-mono text-teal-700 font-bold">📍 4.2 km</span>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <div>
                    <div className="font-bold text-sky-900">Local Police Station</div>
                    <div className="text-[10px] text-sky-700">Tourist Safety Desk</div>
                  </div>
                </div>
                <span className="font-mono text-sky-700 font-bold">📍 3.1 km</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDirections && (
        <DirectionsModal
          isOpen={showDirections}
          onClose={() => setShowDirections(false)}
          startLat={userLat}
          startLng={userLng}
          destLat={place.latitude}
          destLng={place.longitude}
          placeName={place.name}
          placeAddress={place.address}
        />
      )}

      {showReport && (
        <ReportPlaceModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          placeId={place.id}
          placeName={place.name}
        />
      )}
    </div>
  );
};
