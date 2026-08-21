import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, DollarSign, Calendar, Shield, Save, CheckCircle, Sparkles, Building2, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useLocation } from '../../contexts/LocationContext.tsx';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { ward, city, district, taluka, state } = useLocation();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState<number | ''>((user as any)?.age || 25);
  const [annualIncome, setAnnualIncome] = useState<number | ''>((user as any)?.annualIncome || 150000);
  const [occupation, setOccupation] = useState((user as any)?.occupation || 'STUDENT');
  const [gender, setGender] = useState((user as any)?.gender || 'FEMALE');
  const [userDistrict, setUserDistrict] = useState(user?.district || district || 'Pune');
  const [userTaluka, setUserTaluka] = useState(user?.taluka || taluka || 'Pune City');
  const [userCity, setUserCity] = useState(ward || city || 'Pune');
  const [residencyStatus, setResidencyStatus] = useState((user as any)?.residencyStatus || 'MAHARASHTRA');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      if ((user as any).age) setAge((user as any).age);
      if ((user as any).annualIncome) setAnnualIncome((user as any).annualIncome);
      if ((user as any).occupation) setOccupation((user as any).occupation);
      if ((user as any).gender) setGender((user as any).gender);
      if (user.district) setUserDistrict(user.district);
      if (user.taluka) setUserTaluka(user.taluka);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await updateUser({
        name,
        email,
        phone,
        district: userDistrict,
        taluka: userTaluka,
        isProfileComplete: true,
        ...( {
          age: typeof age === 'number' ? age : 25,
          annualIncome: typeof annualIncome === 'number' ? annualIncome : 150000,
          occupation,
          gender,
          residencyStatus,
        } as any),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-slate-800 text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-teal-600/40 border-2 border-teal-300/40 flex items-center justify-center text-teal-200 text-2xl font-black shadow-md shrink-0">
            {name ? name.slice(0, 2).toUpperCase() : 'MR'}
          </div>

          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold text-teal-100 border border-white/20">
              <UserCheck className="w-3.5 h-3.5 text-teal-300" /> {user?.role || 'CITIZEN'} • MahaResilience Account
            </div>
            <h1 className="text-2xl font-extrabold">{name || 'Resident Citizen'}</h1>
            <p className="text-xs text-teal-100 flex items-center justify-center sm:justify-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-teal-300" /> {userDistrict} District ({userTaluka}, {userCity})
            </p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          Profile updated successfully! Your applicable government schemes have been recalculated live.
        </div>
      )}

      {/* Main Form */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-teal-700" /> Citizen Demographic & Welfare Settings
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-semibold">
            {/* Full Name */}
            <div>
              <label className="block text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-slate-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30"
                />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-slate-700 mb-1">Age (Years)</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30"
                  required
                />
              </div>
            </div>

            {/* Annual Family Income */}
            <div>
              <label className="block text-slate-700 mb-1">Annual Family Income (₹)</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value === '' ? '' : parseInt(e.target.value))}
                  placeholder="e.g. 150000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30"
                  required
                />
              </div>
            </div>

            {/* Occupation */}
            <div>
              <label className="block text-slate-700 mb-1">Primary Profession</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30"
                >
                  <option value="WOMEN_HOMEMAKER">Women / Homemaker</option>
                  <option value="FARMER">Farmer / Agriculturalist</option>
                  <option value="STUDENT">Student</option>
                  <option value="UNEMPLOYED">Unemployed Youth</option>
                  <option value="SALARIED">Salaried Employee</option>
                  <option value="SELF_EMPLOYED">Business / Self Employed</option>
                </select>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-slate-700 mb-1">District</label>
              <input
                type="text"
                value={userDistrict}
                onChange={(e) => setUserDistrict(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:bg-white focus:ring-2 focus:ring-teal-600/30"
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2"
            >
              {saving ? (
                'Saving Profile...'
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Profile Details
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
