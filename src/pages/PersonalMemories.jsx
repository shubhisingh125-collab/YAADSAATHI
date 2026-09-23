import React, { useState, useEffect } from 'react';
import {
  Heart,
  User,
  Image as ImageIcon,
  BookOpen,
  Calendar,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';
import * as memoryRepository from '../database/repositories/memoryRepository.js';
import { MemoryItemType } from '../domain/memory/memoryTypes.js';
import { getOrCreateLocalUserId } from '../services/gamePersistenceService.js';
import { syncMemories } from '../services/sync/syncService.js';

export const MEMORY_CATEGORIES = [
  { id: MemoryItemType.FAMILY_MEMBER, labelEn: 'Family Member', labelHi: 'परिवार के सदस्य', icon: '👨‍👩‍👧' },
  { id: MemoryItemType.STORY, labelEn: 'Story & Moment', labelHi: 'सुखद संस्मरण व कहानी', icon: '📖' },
  { id: MemoryItemType.PHOTO, labelEn: 'Photograph', labelHi: 'पारिवारिक तस्वीर', icon: '🖼️' },
  { id: MemoryItemType.ANCESTRAL_PLACE, labelEn: 'Favourite / Native Place', labelHi: 'प्रिय / पैतृक स्थान', icon: '🏡' },
  { id: MemoryItemType.IMPORTANT_DATE, labelEn: 'Important Date', labelHi: 'महत्वपूर्ण तिथि / वर्षगांठ', icon: '📅' },
  { id: MemoryItemType.CULTURAL_TRADITION, labelEn: 'Cultural Custom', labelHi: 'पारंपरिक रीति व उत्सव', icon: '🪔' },
];

export default function PersonalMemories() {
  const { navigateTo, sounds, voice } = useApp();
  const { isHindi } = useI18n();

  const [memories, setMemories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [selectedType, setSelectedType] = useState(MemoryItemType.FAMILY_MEMBER);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [relationship, setRelationship] = useState('');
  const [locationContext, setLocationContext] = useState('');
  const [dateContext, setDateContext] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');

  const userId = getOrCreateLocalUserId();

  const loadMemories = async () => {
    try {
      const items = await memoryRepository.getMemories(userId);
      setMemories(items || []);
    } catch (err) {
      console.warn('[PersonalMemories] Failed to load memories:', err);
    }
  };

  useEffect(() => {
    loadMemories();
  }, [userId]);

  // Handle local image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageDataUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMemory = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    sounds.playSuccessChime();

    const newMemory = {
      userId,
      type: selectedType,
      title: title.trim(),
      description: description.trim(),
      relationship: relationship.trim(),
      locationContext: locationContext.trim(),
      dateContext: dateContext.trim(),
      mediaUrl: imageDataUrl,
    };

    try {
      await memoryRepository.addMemory(newMemory);
      await loadMemories();
      syncMemories(userId).catch(() => {});
      setShowAddModal(false);
      resetForm();
      voice.speak(
        'आपकी याद सुरक्षित कर ली गई है।',
        'Your memory has been saved.'
      );
    } catch (err) {
      console.warn('[PersonalMemories] Save error:', err);
    }
  };

  const handleDelete = async (id) => {
    sounds.playClickChime();
    try {
      await memoryRepository.deleteMemory(id);
      await loadMemories();
      syncMemories(userId).catch(() => {});
    } catch (err) {
      console.warn('[PersonalMemories] Delete error:', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRelationship('');
    setLocationContext('');
    setDateContext('');
    setImageDataUrl('');
  };

  return (
    <div className="space-y-6 pb-12 animate-slow-fade text-left select-none max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#FFF0F3] rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#E84D78]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => {
              sounds.playClickChime();
              navigateTo('settings');
            }}
            className="inline-flex items-center gap-2 text-sm font-black text-[#E84D78] hover:text-[#C2185B] mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>{isHindi ? 'सेटिंग्स पर लौटें' : 'Back to Settings'}</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-3xl">❤️</span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? 'मेरी यादें (पारिवारिक संस्मरण)' : 'Meri Yaadein (Personal Memories)'}
            </h1>
          </div>
          <p className="mt-1 text-lg font-bold text-[#E84D78]">
            {isHindi
              ? 'परिवार के सदस्यों, प्रिय स्थानों और सुखद यादों का व्यक्तिगत संग्रह'
              : 'Cherished memories, family members, and comforting stories'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <VoiceButton
            id="personal-memories-voice"
            textHindi="मेरी यादें पृष्ठ: यहाँ आप परिवार के सदस्यों और प्रिय स्थानों की यादें जोड़ सकते हैं।"
            textEnglish="Meri Yaadein: Here you can save cherished family members, photos, and native places."
            size="lg"
            label={isHindi ? 'सुनें' : 'Listen'}
          />

          <button
            onClick={() => {
              sounds.playClickChime();
              setShowAddModal(true);
            }}
            className="tactile-btn px-6 py-3.5 rounded-2xl bg-[#E84D78] hover:bg-[#C2185B] text-white font-black text-lg inline-flex items-center gap-2 shadow cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>{isHindi ? 'याद जोड़ें' : 'Add Memory'}</span>
          </button>
        </div>
      </div>

      {/* Memory List */}
      {memories.length === 0 ? (
        <div className="bg-white border-3 border-[#FFE4E9] rounded-[2.5rem] p-12 text-center space-y-4">
          <div className="text-6xl">📖</div>
          <h2 className="text-2xl font-black text-[#102A43]">
            {isHindi ? 'अभी कोई याद नहीं जोड़ी गई है' : 'No personal memories added yet'}
          </h2>
          <p className="text-[#5D7184] font-medium max-w-md mx-auto">
            {isHindi
              ? 'अपने बेटे, बेटी, पैतृक गाँव या किसी प्रिय घटना की याद जोड़ें ताकि संस्मरण अभ्यास में वे काम आ सकें।'
              : 'Add memories of family members, favourite places, or special occasions for gentle reminiscence activities.'}
          </p>
          <button
            onClick={() => {
              sounds.playClickChime();
              setShowAddModal(true);
            }}
            className="tactile-btn px-8 py-4 rounded-2xl bg-[#E84D78] hover:bg-[#C2185B] text-white font-black text-xl inline-flex items-center gap-2 shadow cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>{isHindi ? 'पहली याद जोड़ें' : 'Add First Memory'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {memories.map((mem) => {
            const catInfo = MEMORY_CATEGORIES.find((c) => c.id === mem.type) || MEMORY_CATEGORIES[0];
            return (
              <div
                key={mem.id}
                className="p-6 rounded-[2rem] bg-white border-2 border-[#FFE4E9] shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F3] text-[#E84D78] text-xs font-black">
                      <span>{catInfo.icon}</span>
                      <span>{isHindi ? catInfo.labelHi : catInfo.labelEn}</span>
                    </span>

                    <button
                      onClick={() => handleDelete(mem.id)}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg cursor-pointer transition-colors"
                      title={isHindi ? 'हटाएं' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {mem.mediaUrl && (
                    <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <img
                        src={mem.mediaUrl}
                        alt={mem.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <h3 className="text-2xl font-black text-[#102A43]">{mem.title}</h3>
                    {mem.relationship && (
                      <div className="text-sm font-black text-[#E84D78]">
                        {isHindi ? `रिश्ता: ${mem.relationship}` : `Relation: ${mem.relationship}`}
                      </div>
                    )}
                    {mem.description && (
                      <p className="text-base font-medium text-[#5D7184] mt-1">
                        {mem.description}
                      </p>
                    )}
                  </div>

                  {(mem.locationContext || mem.dateContext) && (
                    <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-500 pt-1">
                      {mem.locationContext && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{mem.locationContext}</span>
                        </span>
                      )}
                      {mem.dateContext && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{mem.dateContext}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-xl w-full border-3 border-[#FFE4E9] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
              <h2 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                {isHindi ? 'नई याद जोड़ें' : 'Add New Memory'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMemory} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase">
                  {isHindi ? 'प्रकार चुनें' : 'Category'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                  {MEMORY_CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedType(cat.id)}
                      className={`p-2.5 rounded-xl border text-xs font-black flex items-center gap-1.5 cursor-pointer ${
                        selectedType === cat.id
                          ? 'bg-[#FFF0F3] border-[#E84D78] text-[#E84D78]'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span className="truncate">{isHindi ? cat.labelHi : cat.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Name */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase">
                  {selectedType === MemoryItemType.FAMILY_MEMBER
                    ? (isHindi ? 'नाम' : 'Person Name')
                    : (isHindi ? 'शीर्षक / नाम' : 'Title')}
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    selectedType === MemoryItemType.FAMILY_MEMBER
                      ? (isHindi ? 'उदा. रवि, अनीता...' : 'e.g. Ravi, Anita...')
                      : (isHindi ? 'उदा. माजुली यात्रा, पैतृक गाँव...' : 'e.g. Visit to Majuli, Village trip...')
                  }
                  className="w-full p-3.5 rounded-xl bg-[#FBFAF4] border-2 border-slate-200 font-bold text-lg text-[#102A43] focus:border-[#E84D78] outline-none mt-1"
                />
              </div>

              {/* Relationship (if Family member) */}
              {selectedType === MemoryItemType.FAMILY_MEMBER && (
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">
                    {isHindi ? 'रिश्ता' : 'Relationship'}
                  </label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder={isHindi ? 'उदा. बेटा, बेटी, पोता, सहेली...' : 'e.g. Son, Daughter, Grandson, Sister...'}
                    className="w-full p-3.5 rounded-xl bg-[#FBFAF4] border-2 border-slate-200 font-bold text-lg text-[#102A43] focus:border-[#E84D78] outline-none mt-1"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase">
                  {isHindi ? 'विवरण / संक्षिप्त संस्मरण' : 'Description / Note'}
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isHindi ? 'इस याद से जुड़ी कोई सुखद बात लिखें...' : 'A warm comforting note or memory details...'}
                  className="w-full p-3.5 rounded-xl bg-[#FBFAF4] border-2 border-slate-200 font-bold text-[#102A43] focus:border-[#E84D78] outline-none mt-1"
                />
              </div>

              {/* Optional Location & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">
                    {isHindi ? 'स्थान (वैकल्पिक)' : 'Place (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={locationContext}
                    onChange={(e) => setLocationContext(e.target.value)}
                    placeholder={isHindi ? 'उदा. शिलांग, गाँव...' : 'e.g. Shillong, Village...'}
                    className="w-full p-3 rounded-xl bg-[#FBFAF4] border-2 border-slate-200 font-bold text-[#102A43] focus:border-[#E84D78] outline-none mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">
                    {isHindi ? 'समय / वर्ष (वैकल्पिक)' : 'Time / Year (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={dateContext}
                    onChange={(e) => setDateContext(e.target.value)}
                    placeholder={isHindi ? 'उदा. 1995, शीतकाल...' : 'e.g. 1995, Winter holidays...'}
                    className="w-full p-3 rounded-xl bg-[#FBFAF4] border-2 border-slate-200 font-bold text-[#102A43] focus:border-[#E84D78] outline-none mt-1"
                  />
                </div>
              </div>

              {/* Optional Local Photo */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#E84D78]" />
                  <span>{isHindi ? 'तस्वीर चुनें (केवल स्थानीय सुरक्षित संग्रहण)' : 'Local Photo (Stored safely on device)'}</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2.5 mt-1 text-sm font-bold text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[#FFF0F3] file:text-[#E84D78] file:font-black cursor-pointer"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-black cursor-pointer"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="tactile-btn px-8 py-3 rounded-xl bg-[#E84D78] hover:bg-[#C2185B] text-white font-black cursor-pointer shadow"
                >
                  {isHindi ? 'याद सुरक्षित करें' : 'Save Memory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
