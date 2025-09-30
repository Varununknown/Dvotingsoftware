import React, { useState } from 'react';
import { useVoting } from '../../contexts/VotingContext';
import { X, Plus, Trash2 } from 'lucide-react';

interface CreateElectionModalProps {
  onClose: () => void;
}

interface CandidateForm {
  name: string;
  party: string;
  logo: string;
  photo: string;
  bio: string;
}

const CreateElectionModal: React.FC<CreateElectionModalProps> = ({ onClose }) => {
  const { addElection } = useVoting();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    logo: '🗳️'
  });
  const [candidates, setCandidates] = useState<CandidateForm[]>([
    { name: '', party: '', logo: '🔵', photo: '', bio: '' }
  ]);

  const logoOptions = ['🗳️', '🏛️', '🏢', '🎯', '⚖️', '📊', '🏆', '🎪', '🌟', '💎'];
  const candidateLogos = ['🔵', '🟢', '🟠', '🔴', '🟣', '🟡', '🟤', '⚫', '⚪', '🔸'];
  const samplePhotos = [
    'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/2182973/pexels-photo-2182973.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/3771790/pexels-photo-3771790.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
  ];

  // Function to clean and validate Google Images URLs
  const cleanImageUrl = (url: string): string => {
    // If it's a Google Images URL, try to extract the actual image URL
    if (url.includes('google.com') && url.includes('imgurl=')) {
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const imgUrl = urlParams.get('imgurl');
        if (imgUrl) {
          return decodeURIComponent(imgUrl);
        }
      } catch (error) {
        console.log('Could not extract image URL from Google Images link');
      }
    }
    return url;
  };

  const addCandidate = () => {
    setCandidates([...candidates, { name: '', party: '', logo: '🔵', photo: '', bio: '' }]);
  };

  const removeCandidate = (index: number) => {
    if (candidates.length > 1) {
      setCandidates(candidates.filter((_, i) => i !== index));
    }
  };

  const updateCandidate = (index: number, field: keyof CandidateForm, value: string) => {
    // Clean image URLs, especially from Google Images
    const cleanedValue = field === 'photo' ? cleanImageUrl(value) : value;
    
    setCandidates(prev => 
      prev.map((candidate, i) => 
        i === index ? { ...candidate, [field]: cleanedValue } : candidate
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
      alert('Please fill in all election details');
      return;
    }

    if (candidates.some(c => !c.name || !c.party || !c.bio)) {
      alert('Please fill in all candidate details');
      return;
    }

    if (candidates.length < 2) {
      alert('At least 2 candidates are required');
      return;
    }

    const newElection = {
      id: Date.now().toString(),
      ...formData,
      status: 'upcoming' as const,
      candidates: candidates.map((candidate, index) => ({
        id: (Date.now() + index).toString(),
        ...candidate,
        photo: candidate.photo || samplePhotos[index % samplePhotos.length]
      })),
      votes: {}
    };

    addElection(newElection);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-sm border border-white/20 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Create New Election</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors duration-200"
          >
            <X className="h-6 w-6 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Election Details */}
          <div className="bg-white/50 rounded-2xl p-6 border border-white/30">
            <h3 className="text-xl font-semibold text-slate-800 mb-6">Election Details</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Election Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., General Election 2025"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Election Logo
                </label>
                <div className="flex flex-wrap gap-2">
                  {logoOptions.map((logo) => (
                    <button
                      key={logo}
                      type="button"
                      onClick={() => setFormData({ ...formData, logo })}
                      className={`w-12 h-12 rounded-xl border-2 text-xl hover:scale-105 transition-transform duration-200 ${
                        formData.logo === logo ? 'border-amber-500 bg-amber-50' : 'border-slate-200'
                      }`}
                    >
                      {logo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  rows={3}
                  placeholder="Brief description of the election"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Candidates */}
          <div className="bg-white/50 rounded-2xl p-6 border border-white/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">Candidates</h3>
              <button
                type="button"
                onClick={addCandidate}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Candidate</span>
              </button>
            </div>

            <div className="space-y-6">
              {candidates.map((candidate, index) => (
                <div key={index} className="bg-white/70 rounded-xl p-6 border border-white/40">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-slate-800">Candidate {index + 1}</h4>
                    {candidates.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCandidate(index)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Candidate Name *
                      </label>
                      <input
                        type="text"
                        value={candidate.name}
                        onChange={(e) => updateCandidate(index, 'name', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Full name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Party Name *
                      </label>
                      <input
                        type="text"
                        value={candidate.party}
                        onChange={(e) => updateCandidate(index, 'party', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Political party"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Party Logo
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {candidateLogos.map((logo) => (
                          <button
                            key={logo}
                            type="button"
                            onClick={() => updateCandidate(index, 'logo', logo)}
                            className={`w-10 h-10 rounded-lg border-2 text-lg hover:scale-105 transition-transform duration-200 ${
                              candidate.logo === logo ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                            }`}
                          >
                            {logo}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Candidate Photo
                      </label>
                      
                      {/* Photo URL Input */}
                      <div className="space-y-3">
                        <input
                          type="url"
                          value={candidate.photo}
                          onChange={(e) => updateCandidate(index, 'photo', e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Paste image URL here (e.g., from Google Images)"
                        />
                        
                        {/* Helper Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-700 font-medium mb-1">💡 How to get image URLs:</p>
                          <p className="text-xs text-blue-600">
                            1. Go to Google Images → Search for candidate<br/>
                            2. Right-click on image → "Copy image address"<br/>
                            3. Paste the URL above
                          </p>
                        </div>
                        
                        {/* Image Preview */}
                        {candidate.photo && (
                          <div className="flex items-center space-x-3">
                            <img 
                              src={candidate.photo} 
                              alt="Preview"
                              className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                              onError={(e) => {
                                e.currentTarget.src = samplePhotos[0];
                                console.log('Failed to load image:', candidate.photo);
                              }}
                            />
                            <div className="text-xs text-slate-600">
                              ✅ Photo loaded successfully
                            </div>
                          </div>
                        )}
                        
                        {/* Quick Sample Photos */}
                        <div>
                          <p className="text-xs text-slate-600 mb-2">Or choose from sample photos:</p>
                          <div className="flex flex-wrap gap-2">
                            {samplePhotos.slice(0, 4).map((photo, photoIndex) => (
                              <button
                                key={photoIndex}
                                type="button"
                                onClick={() => updateCandidate(index, 'photo', photo)}
                                className="w-12 h-12 rounded-lg border-2 border-slate-200 hover:border-blue-400 transition-colors overflow-hidden"
                                title="Use this sample photo"
                              >
                                <img 
                                  src={photo} 
                                  alt={`Sample ${photoIndex + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Biography *
                      </label>
                      <textarea
                        value={candidate.bio}
                        onChange={(e) => updateCandidate(index, 'bio', e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Brief biography and qualifications"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-amber-700 transition-colors duration-200"
            >
              Create Election
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateElectionModal;