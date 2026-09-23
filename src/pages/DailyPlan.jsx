import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Play,
  RotateCcw,
  Sun,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n/I18nContext';
import VoiceButton from '../components/VoiceButton';
import { getDailyActivityPlan } from '../services/dailyActivityPlanService';
import { getOrCreateLocalUserId } from '../services/gamePersistenceService';

export default function DailyPlan() {
  const { navigateTo, sounds, voice, patient } = useApp();
  const { isHindi } = useI18n();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0); // 0, 1, 2 for activities, 3 for complete

  useEffect(() => {
    async function loadPlan() {
      try {
        const userId = getOrCreateLocalUserId();
        const dailyPlan = await getDailyActivityPlan(userId);
        setPlan(dailyPlan);

        // Find first incomplete activity
        if (dailyPlan && Array.isArray(dailyPlan.activities)) {
          const firstIncompleteIdx = dailyPlan.activities.findIndex((a) => !a.isCompleted);
          if (firstIncompleteIdx !== -1) {
            setActiveStep(firstIncompleteIdx);
          } else if (dailyPlan.activities.length > 0) {
            // All 3 completed!
            setActiveStep(dailyPlan.activities.length);
          }
        }
      } catch (err) {
        console.warn('[DailyPlan] Failed to load daily activity plan:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, []);

  const handleStartActivity = (gameId, stepIndex) => {
    sounds.playClickChime();
    setActiveStep(stepIndex);
    navigateTo(gameId);
  };

  const handleNextStep = () => {
    sounds.playClickChime();
    if (plan && plan.activities && activeStep < plan.activities.length) {
      const nextGame = plan.activities[activeStep];
      if (nextGame) {
        navigateTo(nextGame.gameId);
      }
    }
  };

  const isAllComplete = plan && plan.activities && plan.activities.every((a) => a.isCompleted);

  useEffect(() => {
    if (isAllComplete) {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    }
  }, [isAllComplete]);

  const userName = patient?.preferredName || patient?.name || patient?.nameHindi || patient?.nameEnglish || (isHindi ? 'वरिष्ठ साथी' : 'Friend');

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold">
        {isHindi ? 'आज की योजना तैयार की जा रही है...' : 'Preparing today’s activity plan...'}
      </div>
    );
  }

  const activities = plan?.activities || [];

  return (
    <div className="space-y-6 pb-12 animate-slow-fade text-left select-none max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#FFE8EF] via-[#FFF0D7] to-[#EAF7EF] rounded-[2.5rem] p-6 sm:p-8 border-2 border-[#167A55]/20 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => {
              sounds.playClickChime();
              navigateTo('home');
            }}
            className="inline-flex items-center gap-2 text-sm font-black text-[#167A55] hover:text-[#126344] mb-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 stroke-[3]" />
            <span>{isHindi ? 'घर पर वापस जाएं' : 'Back to Home'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-4xl">🌸</span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#102A43]">
              {isHindi ? "आज की साथी योजना" : "Today's Saathi Plan"}
            </h1>
          </div>

          <p className="mt-1 text-lg sm:text-xl font-bold text-[#167A55]">
            {isHindi
              ? `नमस्ते ${userName}, आज आपके लिए 3 सुखद गतिविधियां तैयार हैं।`
              : `Good day, ${userName}. 3 gentle activities are ready for you today.`}
          </p>
        </div>

        <VoiceButton
          id="daily-plan-header-voice"
          textHindi={`नमस्ते ${userName}। आज की साथी योजना में 3 गतिविधियां हैं। ${activities.map((a, i) => `गतिविधि ${i + 1}: ${a.titleHindi}`).join('। ')}।`}
          textEnglish={`Hello ${userName}. Today's plan has three gentle activities. ${activities.map((a, i) => `Activity ${i + 1}: ${a.title}`).join('. ')}.`}
          size="lg"
          label={isHindi ? 'योजना सुनें' : 'Listen Plan'}
        />
      </div>

      {/* Plan Complete Celebration Screen */}
      {isAllComplete && (
        <div className="bg-[#EAF7EF] border-4 border-[#167A55] rounded-[2.5rem] p-8 sm:p-12 text-center shadow-md space-y-6">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-white border-2 border-[#167A55]/30 flex items-center justify-center text-5xl shadow-xs">
            🏆
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-5xl font-black text-[#102A43]">
              {isHindi ? 'आज की योजना संपन्न हुई!' : "Today's Plan is Complete!"}
            </h2>
            <p className="text-xl font-bold text-[#167A55]">
              {isHindi
                ? 'बहुत खूब! आपने आज की तीनों गतिविधियां सफलतापूर्वक पूरी कर ली हैं।'
                : 'Wonderful! You have completed all 3 gentle activities today.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 text-4xl text-amber-500">
            <span>⭐</span>
            <span>⭐</span>
            <span>⭐</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigateTo('games')}
              className="tactile-btn px-8 py-4 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-xl flex items-center gap-2 shadow cursor-pointer"
            >
              <span>{isHindi ? 'अन्य खेल देखें' : 'Explore More Activities'}</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>

            <button
              onClick={() => navigateTo('home')}
              className="tactile-btn px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-[#DFF3E7] text-[#102A43] font-black text-xl cursor-pointer"
            >
              <span>{isHindi ? 'घर पर जाएं' : 'Return Home'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3 Activities List */}
      {!isAllComplete && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-black text-[#5D7184] uppercase tracking-wider">
              {isHindi ? 'आज की 3 गतिविधियां (3 Daily Activities)' : "Today's 3 Activities"}
            </span>
            <span className="text-sm font-bold text-[#167A55]">
              {activities.filter((a) => a.isCompleted).length} / {activities.length} {isHindi ? 'पूर्ण' : 'Done'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activities.map((act, idx) => {
              const isCurrent = activeStep === idx && !act.isCompleted;

              return (
                <div
                  key={act.gameId}
                  className={`p-6 sm:p-7 rounded-[2rem] border-3 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 ${
                    act.isCompleted
                      ? 'bg-[#F0FAF4] border-[#167A55]/30 opacity-90'
                      : isCurrent
                      ? 'bg-white border-[#167A55] shadow-md ring-4 ring-[#DFF3E7]'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 ${
                        act.isCompleted ? 'bg-[#EAF7EF]' : 'bg-[#FAF9F6] border border-slate-200'
                      }`}
                    >
                      {act.isCompleted ? '✅' : act.icon}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#EAF7EF] text-[#167A55]">
                          {isHindi ? act.difficultyLabelHindi : act.difficultyLabel}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {act.estimatedDuration}
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-black text-[#102A43]">
                        {isHindi ? act.titleHindi : act.title}
                      </h3>

                      <p className="text-base sm:text-lg font-bold text-[#5D7184]">
                        "{isHindi ? act.reasonHindi : act.reason}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <VoiceButton
                      textHindi={`${act.titleHindi}। ${act.difficultyLabelHindi}। ${act.reasonHindi}`}
                      textEnglish={`${act.title}. ${act.difficultyLabel}. ${act.reason}`}
                      size="md"
                      label=""
                    />

                    {act.isCompleted ? (
                      <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#EAF7EF] text-[#167A55] font-black text-base">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{isHindi ? 'पूर्ण हुआ' : 'Completed'}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartActivity(act.gameId, idx)}
                        className={`tactile-btn px-6 py-3.5 rounded-2xl font-black text-lg flex items-center gap-2 cursor-pointer shadow-sm ${
                          isCurrent
                            ? 'bg-[#167A55] hover:bg-[#126344] text-white'
                            : 'bg-[#EAF7EF] hover:bg-[#DFF3E7] text-[#167A55] border border-[#167A55]/30'
                        }`}
                      >
                        <Play className="w-5 h-5 fill-current" />
                        <span>{isHindi ? 'शुरू करें' : 'Start'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progressive Start / Next Button at bottom */}
          <div className="pt-4 text-center">
            <button
              onClick={handleNextStep}
              className="tactile-btn px-10 py-5 rounded-2xl bg-[#167A55] hover:bg-[#126344] text-white font-black text-2xl inline-flex items-center justify-center gap-3 shadow-lg cursor-pointer"
            >
              <span>
                {activeStep === 0
                  ? isHindi
                    ? "आज की योजना शुरू करें (Start Today's Plan)"
                    : "Start Today's Plan"
                  : isHindi
                  ? 'अगली गतिविधि पर जाएं (Next Activity)'
                  : 'Continue Next Activity'}
              </span>
              <ArrowRight className="w-6 h-6 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
