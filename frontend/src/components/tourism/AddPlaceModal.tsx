import React, { useState } from 'react';
import { X, MapPin, Upload, Navigation, ShieldCheck, AlertTriangle, RefreshCw, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { submitCommunityPlace, TouristPlace } from '../../services/tourismService.ts';
import { uploadImageToCloudinary } from '../../services/cloudinary.service.ts';
import { RecaptchaWidget } from '../security/RecaptchaWidget.tsx';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPlace?: TouristPlace) => void;
}

const customPickerIcon = L.divIcon({
  className: 'picker-location-marker',
  html: `<div style="width:34px;height:34px;background:#0d9488;color:white;border:3px solid white;border-radius:9999px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.3);font-size:18px;">📍</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const LocationMarkerPicker: React.FC<{
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
}> = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return (
    <Marker
      position={position}
      draggable={true}
      icon={customPickerIcon}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lat, pos.lng]);
        },
      }}
    />
  );
};

export const AddPlaceModal: React.FC<AddPlaceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { latitude, longitude, district, city, ward, detectLocation } = useLocation();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Forts');
  const [description, setDescription] = useState('');
  const [pickerPos, setPickerPos] = useState<[number, number]>([latitude || 18.5204, longitude || 73.8567]);
  const [placeAddress, setPlaceAddress] = useState(`${ward || city}, ${district}, Maharashtra`);
  const [openingHours, setOpeningHours] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [website, setWebsite] = useState('');
  const [bestTimeToVisit, setBestTimeToVisit] = useState('');
  const [safetyInfo, setSafetyInfo] = useState('');

  // Image Upload State
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Duplicate Check & Submission State
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<TouristPlace | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    'Forts',
    'Temples',
    'Waterfalls',
    'Lakes',
    'Beaches',
    'Trekking',
    'Nature',
    'Historical',
    'Museums',
    'Adventure',
    'Parks',
    'Food',
    'Hotels',
    'Tourist Spots',
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setImageFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUseCurrentGps = async () => {
    await detectLocation();
    if (latitude && longitude) {
      setPickerPos([latitude, longitude]);
    }
  };

  const handleSubmit = async (bypass = false) => {
    if (!name.trim() || !description.trim()) {
      setError('Please provide place name and description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Upload photos to Cloudinary / Base64 fallback
      let uploadedUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        for (const file of imageFiles) {
          const url = await uploadImageToCloudinary(file, 'community_tourism');
          if (url) uploadedUrls.push(url);
        }
        setUploadingImages(false);
      }

      const res = await submitCommunityPlace({
        name: name.trim(),
        category,
        description: description.trim(),
        latitude: pickerPos[0],
        longitude: pickerPos[1],
        address: placeAddress,
        district: district || 'Pune',
        city: city || district,
        taluka: ward || city,
        images: uploadedUrls,
        openingHours: openingHours.trim() || undefined,
        entryFee: entryFee.trim() || undefined,
        contactNumber: contactNumber.trim() || undefined,
        website: website.trim() || undefined,
        bestTimeToVisit: bestTimeToVisit.trim() || undefined,
        safetyInfo: safetyInfo.trim() || undefined,
        userId: user?.id || 'community-resident',
        userName: user?.name || 'Local Resident',
        bypassDuplicateCheck: bypass,
      });

      if (res.similarExists && res.existingPlace && !bypass) {
        setDuplicateWarning(res.existingPlace);
        setSubmitting(false);
        return;
      }

      if (res.success) {
        onSuccess(res.place);
        onClose();
      } else {
        setError(res.message || 'Submission failed.');
      }
    } catch (err: any) {
      setError('Submission error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold">
              ➕
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-snug">Suggest a Community Place</h3>
              <p className="text-xs text-teal-200">Help travelers and locals discover hidden spots in Maharashtra</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Navigation */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-around text-xs font-bold text-slate-600 shrink-0">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${
              step === 1 ? 'bg-teal-600 text-white' : 'hover:bg-slate-200'
            }`}
          >
            1. Basic Info
          </button>
          <button
            onClick={() => setStep(2)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${
              step === 2 ? 'bg-teal-600 text-white' : 'hover:bg-slate-200'
            }`}
          >
            2. Location Map
          </button>
          <button
            onClick={() => setStep(3)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${
              step === 3 ? 'bg-teal-600 text-white' : 'hover:bg-slate-200'
            }`}
          >
            3. Photos
          </button>
          <button
            onClick={() => setStep(4)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${
              step === 4 ? 'bg-teal-600 text-white' : 'hover:bg-slate-200'
            }`}
          >
            4. Timings & Review
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Place / Attraction Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kas Pathar Plateau of Flowers, Kopeshwar Temple..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description & Significance *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the history, nature, culture, key highlights, or local experience..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Location Picker */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Choose Coordinates on Map</h4>
                  <p className="text-[11px] text-slate-500">
                    Click anywhere on the map or drag the marker to set exact coordinates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleUseCurrentGps}
                  className="px-3 py-1.5 bg-teal-100 text-teal-800 font-bold rounded-xl text-[11px] flex items-center gap-1 border border-teal-200"
                >
                  <Navigation className="w-3.5 h-3.5" /> Use My GPS
                </button>
              </div>

              <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-300 shadow-inner relative">
                <MapContainer center={pickerPos} zoom={13} style={{ width: '100%', height: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <LocationMarkerPicker position={pickerPos} setPosition={setPickerPos} />
                </MapContainer>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-[11px] space-y-1">
                <div className="flex items-center gap-1 font-bold text-teal-800">
                  <MapPin className="w-4 h-4 text-teal-600" /> Selected Coordinates:
                </div>
                <div className="text-slate-600 font-mono">
                  Latitude: {pickerPos[0].toFixed(5)} | Longitude: {pickerPos[1].toFixed(5)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Address / Locality
                </label>
                <input
                  type="text"
                  value={placeAddress}
                  onChange={(e) => setPlaceAddress(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Photos */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Upload Place Photos (Multiple Supported)
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Upload clear photos of the attraction, entrance, scenery, or surroundings.
                </p>

                <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 bg-slate-50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  <Upload className="w-8 h-8 text-teal-600 mb-2" />
                  <span className="font-bold text-slate-700 text-xs">Click to select image files</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WEBP (Max 10MB per file)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {imagePreviews.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Selected Photos ({imagePreviews.length})</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {imagePreviews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Timings & Review */}
          {step === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Opening Hours (Optional)
                  </label>
                  <input
                    type="text"
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="e.g. 09:00 AM - 06:00 PM"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Entry Fee (Optional)
                  </label>
                  <input
                    type="text"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value)}
                    placeholder="e.g. Free or ₹50 per person"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Best Time to Visit (Optional)
                  </label>
                  <input
                    type="text"
                    value={bestTimeToVisit}
                    onChange={(e) => setBestTimeToVisit(e.target.value)}
                    placeholder="e.g. July to October (Monsoon)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Helpline (Optional)
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. 0231-2541744"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Safety Information & Precautions (Optional)
                </label>
                <input
                  type="text"
                  value={safetyInfo}
                  onChange={(e) => setSafetyInfo(e.target.value)}
                  placeholder="e.g. Slippery rocks near waterfall pool. Keep children close."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs"
                />
              </div>

              {/* Duplicate Warning Dialog */}
              {duplicateWarning && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2 text-amber-900">
                  <div className="font-extrabold text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Similar Place Already Exists Nearby!
                  </div>
                  <p className="text-xs">
                    We found <strong>{duplicateWarning.name}</strong> ({duplicateWarning.category}) at this location.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDuplicateWarning(null)}
                      className="px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-bold text-[11px]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmit(true)}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-xl font-bold text-[11px]"
                    >
                      Submit Anyway (Distinct Place)
                    </button>
                  </div>
                </div>
              )}

              <RecaptchaWidget onVerify={(t) => setRecaptchaToken(t)} />
            </div>
          )}
        </div>

        {/* Footer Wizard Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              Next Step ➔
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || uploadingImages}
              onClick={() => handleSubmit(false)}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {submitting || uploadingImages ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Submit Place for Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
