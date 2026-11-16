import { useState, useEffect } from 'react';
import { fetchSettings, saveSettingsStep, submitSettings } from '../api';

export default function SettingsWizard({ accountId, onClose }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 1: {}, 2: {}, 3: {}, 4: {} });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load existing drafts from the server when modal opens
  useEffect(() => {
    fetchSettings(accountId).then(drafts => {
      setFormData(prev => ({ ...prev, ...drafts }));
    });
  }, [accountId]);

  // Saves current step to server. Catches tricky validation errors.
  const handleSaveAndNext = async () => {
    setSaving(true);
    setErrors({});
    try {
      await saveSettingsStep(accountId, step, formData[step]);
      if (step < 4) setStep(step + 1);
    } catch (err) {
      // If the API throws the deliberate Step 2 error, route back to that step
      if (err.step) {
        setStep(err.step);
        setErrors(err.errors || {});
      }
    }
    setSaving(false);
  };

  const handleFinalSubmit = async () => {
    setSaving(true);
    setErrors({});
    try {
      await submitSettings(accountId);
      onClose(); 
    } catch (err) {
      if (err.step) {
        setStep(err.step);
        setErrors(err.errors || {});
      }
    }
    setSaving(false);
  };

  // Helper to update specific fields cleanly
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [step]: { ...prev[step], [field]: value }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Account Settings</h2>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">Step {step} of 4</span>
        </div>
        
        <div className="space-y-5 min-h-[160px]">
          {step === 1 && (
            <>
              <input className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                     placeholder="Full Name" value={formData[1].name || ''} onChange={e => updateField('name', e.target.value)} />
              <input className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                     placeholder="Email Address" type="email" value={formData[1].email || ''} onChange={e => updateField('email', e.target.value)} />
            </>
          )}

          {step === 2 && (
            <>
              <select className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                      value={formData[2].plan || ''} onChange={e => updateField('plan', e.target.value)}>
                <option value="">Select Billing Plan</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
              
              <div>
                <input className={`w-full border p-3 rounded-lg outline-none focus:ring-2 ${errors.billing_country ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} 
                       placeholder="Billing Country (e.g., US, IN)" value={formData[2].billing_country || ''} onChange={e => updateField('billing_country', e.target.value)} />
                {errors.billing_country && <p className="text-red-500 text-sm mt-1 flex items-center">⚠ {errors.billing_country}</p>}
              </div>
            </>
          )}

          {step === 3 && (
            <input className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                   placeholder="Monthly Minutes Cap" type="number" value={formData[3].minutes_cap || ''} onChange={e => updateField('minutes_cap', Number(e.target.value))} />
          )}

          {step === 4 && (
            <input className="w-full border border-gray-300 p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                   placeholder="Webhook URL (https://...)" value={formData[4].webhook_url || ''} onChange={e => updateField('webhook_url', e.target.value)} />
          )}
        </div>

        <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2">Cancel</button>
          <div className="space-x-3">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={handleSaveAndNext} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Next'}
              </button>
            ) : (
              <button onClick={handleFinalSubmit} disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50">
                {saving ? 'Submitting...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}