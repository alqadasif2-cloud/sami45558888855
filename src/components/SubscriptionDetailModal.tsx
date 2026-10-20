import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  CheckCircle2,
  Clock,
  Users,
  Copy,
  Check,
  Send,
  AlertCircle,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SubscriptionPlan } from '../types/subscription';
import {
  recordUserConsent,
  getUserConsent,
  generateInquiryMessage,
} from '../services/subscriptions';
import { CurrentUser } from '../data/auth';

interface SubscriptionDetailModalProps {
  plan: SubscriptionPlan;
  currentUser: CurrentUser | null;
  onClose: () => void;
  onStartInquiry?: (message: string) => void;
  onRequestPackageSupport?: (plan: SubscriptionPlan) => void;
}

export const SubscriptionDetailModal: React.FC<SubscriptionDetailModalProps> = ({
  plan,
  currentUser,
  onClose,
  onStartInquiry,
  onRequestPackageSupport,
}) => {
  const isGuest = Boolean(currentUser?.isGuest || currentUser?.role === 'guest');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [userPreviousConsentVersion, setUserPreviousConsentVersion] = useState<number | null>(null);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>(
    plan.paymentMethods.find((m) => m.isEnabled)?.id || ''
  );
  const [useInstallment, setUseInstallment] = useState(false);
  const [showFullTermsAccordion, setShowFullTermsAccordion] = useState(plan.id === 'sami_vip');
  const [expandedTermId, setExpandedTermId] = useState<string | null>(null);

  // Check if current user has already agreed to this version
  useEffect(() => {
    if (currentUser?.id && !isGuest) {
      getUserConsent(currentUser.id, plan.id).then((consent) => {
        if (consent) {
          setUserPreviousConsentVersion(consent.termsVersion);
          if (consent.termsVersion === plan.termsVersion) {
            setHasAgreedToTerms(true);
          }
        }
      });
    }
  }, [currentUser?.id, plan.id, plan.termsVersion, isGuest]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const activeTerms = plan.termsItems.filter((t) => t.isEnabled);
  const isVip = plan.id === 'sami_vip';
  const requiresConsent = !isGuest && activeTerms.length > 0 && isVip;
  const isPlanClosed = !plan.isActive || plan.status === 'closed';

  const handleInquiryClick = async () => {
    if (isPlanClosed) return;

    if (isGuest) {
      if (onRequestPackageSupport) {
        onRequestPackageSupport(plan);
      } else {
        const guestNum = currentUser?.guestNumber || 1001;
        onStartInquiry?.(`مرحبًا، أنا ضيف رقم ${guestNum}، وأود الاستفسار عن باقة ${plan.name}.`);
      }
      onClose();
      return;
    }

    if (requiresConsent && !hasAgreedToTerms && currentUser) {
      alert('يرجى الموافقة على شروط وأحكام الاشتراك أولاً للمتابعة.');
      return;
    }

    if (currentUser && requiresConsent && hasAgreedToTerms) {
      setIsSubmittingConsent(true);
      try {
        await recordUserConsent({
          userId: currentUser.id,
          userName: currentUser.displayName,
          subscriptionId: plan.id,
          subscriptionName: plan.name,
          termsVersion: plan.termsVersion,
        });
      } catch (err) {
        console.warn('Could not record consent:', err);
      } finally {
        setIsSubmittingConsent(false);
      }
    }

    const message = generateInquiryMessage(plan, useInstallment);
    onStartInquiry?.(message);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#090f1d] border border-amber-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(245,158,11,0.15)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header with Luxury Golden Banner */}
        <div className="relative px-5 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/15 via-[#0e172a] to-amber-500/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{plan.name}</h3>
                {isVip && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.6)]">
                    VIP حصرية
                  </span>
                )}
                {isPlanClosed ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400">
                    مغلق مؤقتاً
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                    متاح للاشتراك
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                معرف الاشتراك الثابت: <span className="font-mono text-amber-300">{plan.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-right">
          {/* Closed Message Banner if not active */}
          {isPlanClosed && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-3 text-rose-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">استقبال الاشتراكات الجديدة متوقف حالياً</p>
                <p className="text-rose-300/90 leading-relaxed">
                  {plan.closedMessage || 'الاشتراك مغلق مؤقتاً بقرار من الإدارة. تواصل مع Sami للاستفسار.'}
                </p>
              </div>
            </div>
          )}

          {/* Pricing & Metric Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Price Badge */}
            <div className="p-3 rounded-2xl bg-[#0d1627] border border-amber-500/30 text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-amber-400/5 group-hover:bg-amber-400/10 transition" />
              <p className="text-[11px] font-bold text-slate-400">سعر الاشتراك</p>
              <p className="text-xl font-black text-amber-400 mt-1 font-mono">
                {plan.price} {plan.currency}
              </p>
            </div>

            {/* Duration Badge */}
            <div className="p-3 rounded-2xl bg-[#0d1627] border border-slate-700/60 text-center">
              <p className="text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                المدة
              </p>
              <p className="text-sm font-black text-white mt-1.5">
                {plan.durationDays > 0 ? `${plan.durationDays} يوم` : 'مستمر'}
              </p>
            </div>

            {/* Capacity / Seats Badge */}
            <div className="p-3 rounded-2xl bg-[#0d1627] border border-slate-700/60 text-center">
              <p className="text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-amber-400" />
                المقاعد الأسبوعية
              </p>
              <p className="text-sm font-black text-white mt-1.5">
                {plan.maxSubscribers > 0 ? `${plan.maxSubscribers} مشتركين` : 'مفتوح'}
              </p>
            </div>

            {/* Installments Badge */}
            <div className="p-3 rounded-2xl bg-[#0d1627] border border-slate-700/60 text-center">
              <p className="text-[11px] font-bold text-slate-400">نظام الدفع</p>
              <p className="text-xs font-bold text-slate-200 mt-1.5">
                {plan.allowsInstallments
                  ? `دفعات (بدءاً من ${plan.installmentMinimum}${plan.currency})`
                  : 'دفع كامل'}
              </p>
            </div>
          </div>

          {/* Short Description */}
          <div className="p-3.5 rounded-2xl bg-[#0c1424] border border-slate-800">
            <h4 className="text-xs font-black text-amber-400 mb-1">نبذة عن الاشتراك</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{plan.shortDescription}</p>
          </div>

          {/* Full Description */}
          {plan.fullDescription && plan.fullDescription !== plan.shortDescription && (
            <div className="p-3.5 rounded-2xl bg-[#0c1424] border border-slate-800">
              <h4 className="text-xs font-black text-amber-400 mb-1">التفاصيل الكاملة</h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {plan.fullDescription}
              </p>
            </div>
          )}

          {/* Payment Methods Section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <span>طرق الدفع المتاحة للاشتراك</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({plan.paymentMethods.filter((m) => m.isEnabled).length} طريقة مفعلة)
              </span>
            </h4>

            <div className="space-y-2">
              {plan.paymentMethods
                .filter((m) => m.isEnabled)
                .map((method) => {
                  const isSelected = selectedPaymentMethodId === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedPaymentMethodId(method.id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'bg-[#0b1220] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-amber-400 bg-amber-400 text-slate-950'
                                : 'border-slate-600'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                          </span>
                          <span className="text-xs font-bold text-white">{method.name}</span>
                          {method.network && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                              {method.network}
                            </span>
                          )}
                        </div>
                      </div>

                      {method.addressOrDetails && (
                        <div className="mt-2 flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">
                          <code className="text-[11px] text-amber-300/90 font-mono truncate dir-ltr select-all">
                            {method.addressOrDetails}
                          </code>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(method.addressOrDetails!, method.id);
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 flex items-center gap-1 transition shrink-0"
                          >
                            {copiedKey === method.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>نسخ</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {method.instructions && (
                        <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                          {method.instructions}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Installment Choice if allowed */}
            {plan.allowsInstallments && (
              <div className="mt-2 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-200">الرغبة في الدفع بنظام الدفعات</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    الحد الأدنى للدفعة الأولى: {plan.installmentMinimum} {plan.currency}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useInstallment}
                    onChange={(e) => setUseInstallment(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>
            )}
          </div>

          {/* Terms and Conditions Accordion Section */}
          {activeTerms.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-[#0b1220] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFullTermsAccordion(!showFullTermsAccordion)}
                className="w-full p-3.5 flex items-center justify-between text-right hover:bg-slate-800/40 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black text-white">
                    {plan.termsTitle || 'الشروط والأحكام الرسمية'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono">
                    v{plan.termsVersion} ({activeTerms.length} بند)
                  </span>
                </div>
                {showFullTermsAccordion ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showFullTermsAccordion && (
                <div className="p-3.5 border-t border-slate-800/80 space-y-2 bg-[#080d17]/80 max-h-72 overflow-y-auto">
                  {activeTerms.map((term, index) => {
                    const isExpanded = expandedTermId === term.id;
                    return (
                      <div
                        key={term.id}
                        className="p-2.5 rounded-xl bg-[#0d1627] border border-slate-800 text-right space-y-1"
                      >
                        <div
                          onClick={() => setExpandedTermId(isExpanded ? null : term.id)}
                          className="flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center font-mono shrink-0">
                              {term.order || index + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-200">{term.title}</span>
                          </div>
                          <span className="text-slate-500 text-xs">
                            {isExpanded ? 'إخفاء' : 'عرض'}
                          </span>
                        </div>
                        <p
                          className={`text-xs text-slate-300/90 leading-relaxed pt-1 border-t border-slate-800/50 mt-1.5 ${
                            isExpanded ? 'block' : 'line-clamp-2'
                          }`}
                        >
                          {term.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* User Consent Agreement Checkbox for Sami VIP */}
          {requiresConsent && !isPlanClosed && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasAgreedToTerms}
                  onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-amber-500 rounded bg-slate-900 border-slate-700 focus:ring-amber-400"
                />
                <span className="text-xs font-bold text-amber-200 leading-relaxed">
                  أقر بموافقتي الكاملة والتزامي بجميع بنود وشروط وقوانين الانضباط الخاصة بقناة Sami VIP (الإصدار v{plan.termsVersion}) وإدارة المخاطر.
                </span>
              </label>

              {userPreviousConsentVersion && userPreviousConsentVersion !== plan.termsVersion && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 pr-7 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    تم تحديث الشروط من الإصدار v{userPreviousConsentVersion} إلى v{plan.termsVersion}. يرجى الموافقة على النسخة الجديدة للمتابعة.
                  </span>
                </div>
              )}

              {hasAgreedToTerms && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 pr-7 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>تم تسجيل الموافقة الرسمية بنجاح ✓</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#090f1d] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
          >
            إغلاق
          </button>

          <button
            type="button"
            disabled={isPlanClosed || (!isGuest && requiresConsent && !hasAgreedToTerms) || isSubmittingConsent}
            onClick={handleInquiryClick}
            className={`px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-lg ${
              isPlanClosed || (!isGuest && requiresConsent && !hasAgreedToTerms)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:brightness-110 shadow-amber-500/25 active:scale-95'
            }`}
          >
            {isSubmittingConsent ? (
              <span>جاري الحفظ...</span>
            ) : isPlanClosed ? (
              <>
                <Lock className="w-4 h-4" />
                <span>الاشتراك مغلق</span>
              </>
            ) : isGuest ? (
              <>
                <Send className="w-4 h-4" />
                <span>المزيد من المعلومات والاستفسار 💬</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>طلب الاشتراك والتواصل في الخاص</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
