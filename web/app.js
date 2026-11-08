document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("fileInput");
    const confSlider = document.getElementById("confSlider");
    const sliderValueBadge = document.getElementById("sliderValueBadge");
    const statusCard = document.getElementById("statusCard");
    const resultsSection = document.getElementById("resultsSection");

    const presetOptimalBtn = document.getElementById("presetOptimalBtn");
    const presetHighBtn = document.getElementById("presetHighBtn");
    const presetConservativeBtn = document.getElementById("presetConservativeBtn");
    const presetBtns = [presetOptimalBtn, presetHighBtn, presetConservativeBtn];

    const sampleBitewing1Btn = document.getElementById("sampleBitewing1Btn");
    const sampleBitewing2Btn = document.getElementById("sampleBitewing2Btn");
    const sampleClinical1Btn = document.getElementById("sampleClinical1Btn");
    const sampleNormalBtn = document.getElementById("sampleNormalBtn");

    const modAutoBtn = document.getElementById("modAutoBtn");
    const modOpgBtn = document.getElementById("modOpgBtn");
    const modBwBtn = document.getElementById("modBwBtn");
    const modBtns = [modAutoBtn, modOpgBtn, modBwBtn];

    const toggleViewBtn = document.getElementById("toggleViewBtn");
    const boxedImage = document.getElementById("boxedImage");

    const langEnBtn = document.getElementById("langEnBtn");
    const langFaBtn = document.getElementById("langFaBtn");

    let currentImageData = null;
    let currentFilename = "XRay_Scan.jpg";
    let currentModality = "auto";
    let isShowingClean = false;
    let lastAnalysisResult = null;
    let debounceTimer = null;
    let currentSelectedTooth = null;

    // Bilingual State: Default is English ('en')
    let currentLang = localStorage.getItem("dentalai_lang") || "en";

    // =========================================================================
    // I18N Translations Dictionary
    // =========================================================================
    const I18N = {
        en: {
            app_title: "DentalAI Multi-Modality Studio",
            app_subtitle: "Panoramic (OPG) & Bitewing AI Pathology Analyzer • Single-Tooth Precision Bounding • FDI 32-Tooth Standard",
            badge_model: "Model: YOLOv8-Dental",
            badge_fdi: "Standard: FDI 11-48",
            step_1: "Upload Radiograph (or Select Clinical Sample)",
            step_2: "Set AI Sensitivity (Recommended: 15%)",
            step_3: "View Bounding Boxes, Odontogram & Clinical Report",
            upload_heading: "Upload Dental Radiograph (Panoramic OPG or Bitewing)",
            upload_sub: "Upload a Panoramic (OPG full mouth) or Bitewing (posterior interproximal caries) radiograph. The AI will automatically identify the modality and inspect each tooth individually.",
            modality_label: "Radiography Modality:",
            mod_auto: "⚡ Auto-Detect Modality (OPG / BW)",
            mod_opg: "🦷 Panoramic Radiograph (OPG)",
            mod_bw: "🔍 Intraoral Bitewing (BW)",
            drop_text: "Drag & drop your dental X-ray or PDF report here",
            or_divider: "OR",
            choose_file_btn: "📁 Select Radiograph File from Computer",
            file_hint: "Accepted formats: JPG, PNG, WEBP, BMP, PDF",
            samples_heading: "⚡ Or click a clinical benchmark sample for instant testing:",
            sample1_title: "Sample 1 (Right Bitewing):",
            sample1_desc: "Proximal caries & radiopaque restorations",
            sample2_title: "Sample 2 (Left Bitewing):",
            sample2_desc: "Extensive restorations & recurrent margins",
            sample3_title: "Sample 3 (Panoramic OPG):",
            sample3_desc: "Multi-quadrant caries & root radiolucency",
            sample4_title: "Sample 4 (Healthy OPG):",
            sample4_desc: "Normal anatomy & sound dentition",
            sensitivity_title: "AI Sensitivity Threshold:",
            optimal_hint: "⭐ Optimal setting for clinical practice: <strong>15% (Balanced)</strong>",
            preset_optimal_title: "🌟 Optimal & Recommended (15%)",
            preset_optimal_desc: "Best balance between pathology detection and avoiding false alarms",
            preset_high_title: "🔍 High Sensitivity (8%)",
            preset_high_desc: "Flag all subtle, suspicious, and early-stage lesions",
            preset_strict_title: "🛡️ Strict / Conservative (25%)",
            preset_strict_desc: "Display only definitive and advanced pathologies",
            bound_sensitive: "5% (Sensitive)",
            bound_strict: "35% (Conservative)",
            slider_explanation: "💡 <strong>Guide:</strong> At the recommended <strong>15%</strong> threshold, the model inspects each individual tooth. Adjust the slider at any time to fine-tune the sensitivity.",
            status_title: "Analyzing radiograph with AI deep learning model...",
            status_desc: "Enhancing contrast, isolating individual tooth loci, and calibrating risk margins",
            diag_tag: "Clinical Evaluation Summary",
            metric_confidence: "Diagnostic Certainty",
            metric_confidence_sub: "Mean Probability",
            metric_error: "Statistical Uncertainty",
            metric_error_sub: "Risk Margin",
            metric_findings: "Teeth with Findings",
            metric_findings_sub: "Requiring Attention",
            boxes_title: "Pathology Localization on Radiograph (YOLOv8 Bounding Boxes)",
            boxes_desc: "Calibrated narrow contour drawn around each affected tooth with standard FDI numbering.",
            btn_toggle_clean: "🔄 Show Raw Image Without Boxes",
            btn_toggle_boxes: "🎯 Show AI Bounding Boxes",
            cap_caries: "Red: Dental Caries",
            cap_restoration: "Blue: Restoration / Filling",
            cap_impacted: "Amber: Impacted Tooth",
            cap_periapical: "Purple: Root Lesion / Bone Loss",
            cap_sound: "Green: Sound Dentition",
            odontogram_title: "🦷 Interactive 32 Permanent Teeth Map — FDI World Dental Standard",
            odontogram_desc: "Click any tooth to inspect its anatomy, FDI number, and clinical diagnosis. Color indicates clinical status.",
            leg_sound: "Sound",
            leg_caries: "Caries",
            leg_restoration: "Restoration",
            leg_impacted: "Impacted",
            leg_periapical: "Root Lesion",
            leg_outofview: "Out of View",
            tooth_location_prompt: "Anatomical Site:",
            tooth_treatment_prompt: "Recommended Clinical Management:",
            conf_title: "Certainty",
            err_title: "Error Margin",
            fdi_guide_title: "FDI Two-Digit Dental Numbering Standard:",
            fdi_guide_sub: "The World Dental Federation (FDI) uses a systematic two-digit designation for permanent teeth:",
            fdi_col1_title: "🔢 1st Digit: Jaw Quadrant",
            fdi_q1: "<strong>Quadrant 1 (10s):</strong> Upper Right — Teeth #11 to #18",
            fdi_q2: "<strong>Quadrant 2 (20s):</strong> Upper Left — Teeth #21 to #28",
            fdi_q3: "<strong>Quadrant 3 (30s):</strong> Lower Left — Teeth #31 to #38",
            fdi_q4: "<strong>Quadrant 4 (40s):</strong> Lower Right — Teeth #41 to #48",
            fdi_col2_title: "🦷 2nd Digit: Tooth Position (Anterior to Posterior)",
            fdi_pos1: "<strong>1 & 2:</strong> Central and Lateral Incisors — Single rooted",
            fdi_pos2: "<strong>3:</strong> Canine (Cuspid) — Longest single root in jaw",
            fdi_pos3: "<strong>4 & 5:</strong> 1st and 2nd Premolars (Bicuspids) — 1 or 2 roots",
            fdi_pos4: "<strong>6, 7 & 8:</strong> 1st, 2nd, and 3rd Molars — Multi-rooted (2 to 3 roots)",
            table_title: "Detailed Findings & Anatomical Locations",
            table_desc: "Specific lesion localization across enamel, dentin, pulp, root apex, and crestal bone.",
            th_tooth: "Tooth # & Name",
            th_pathology: "Pathology / Finding",
            th_location: "Anatomical Site",
            th_confidence: "Diagnostic Certainty",
            th_error: "Error Margin",
            th_treatment: "Recommended Management",
            table_empty: "✨ No pathological abnormalities detected. All 32 teeth are within sound, healthy clinical limits.",
            crops_title: "Zoomed Tooth Findings (ROIs)",
            crops_desc: "High-magnification crops of affected teeth to evaluate enamel and apical bone integrity.",
            report_title: "Official Dental Radiology AI Report",
            report_desc: "Documented summary of patient dental status with direct print or PDF export.",
            print_btn: "🖨️ Print / Save Official PDF Report",
            footer_text: "DentalAI Multi-Modality Studio • Deep Learning Dental Radiology Analyzer based on FDI World Dental Standard (Prototype v0.1)"
        },
        fa: {
            app_title: "سامانه هوشمند رادیولوژی فک و دندان",
            app_subtitle: "تشخیص عوارض OPG و بایت‌وینگ • کادرکشی دقیق تک‌دندان • چارتینگ ۳۲ دندان FDI • محاسبه درستی و خطا",
            badge_model: "مدل فعال: YOLOv8-Dental",
            badge_fdi: "استاندارد جهانی FDI 11-48",
            step_1: "بارگذاری رادیوگرافی (یا انتخاب نمونه)",
            step_2: "تنظیم حساسیت هوش مصنوعی (پیشنهادی: ۱۵٪)",
            step_3: "مشاهده کادرکشی، چارت دندان‌ها و گزارش بالینی",
            upload_heading: "بارگذاری تصویر رادیوگرافی دندان (OPG یا Bitewing)",
            upload_sub: "تصویر رادیوگرافی پانورامیک (کل فک) یا بایت‌وینگ (پوسیدگی بین‌دندانی) را بارگذاری کنید تا هوش مصنوعی به طور خودکار نوع رادیوگرافی را تشخیص داده و دندان‌ها را ارزیابی کند.",
            modality_label: "نوع رادیوگرافی:",
            mod_auto: "⚡ تشخیص خودکار هوشمند (Auto)",
            mod_opg: "🦷 رادیوگرافی پانورامیک (OPG)",
            mod_bw: "🔍 بایت‌وینگ / پری‌آپیکال (Bitewing)",
            drop_text: "تصویر رادیوگرافی یا PDF را اینجا بکشید و رها کنید (Drag & Drop)",
            or_divider: "یا",
            choose_file_btn: "📁 انتخاب فایل رادیوگرافی از سیستم",
            file_hint: "فرمت‌های قابل پذیرش: JPG, PNG, WEBP, BMP, PDF",
            samples_heading: "⚡ یا برای آزمایش سریع، یکی از نمونه‌های آماده زیر را انتخاب کنید:",
            sample1_title: "نمونه ۱ (بایت‌وینگ راست BW):",
            sample1_desc: "پوسیدگی‌های بین‌دندانی پروگزیمال و پرکردگی",
            sample2_title: "نمونه ۲ (بایت‌وینگ چپ BW):",
            sample2_desc: "ترمیم‌های وسیع فلزی و ارزیابی لبه‌ها",
            sample3_title: "نمونه ۳ (OPG پانورامیک):",
            sample3_desc: "پوسیدگی‌های متعدد دندان و ضایعه ریشه",
            sample4_title: "نمونه ۴ (سالم):",
            sample4_desc: "قوس فکی طبیعی و دندان‌های سالم",
            sensitivity_title: "تنظیم آستانه حساسیت هوش مصنوعی:",
            optimal_hint: "⭐ بهترین و مناسب‌ترین حالت برای کاربری بالینی: <strong>۱۵٪ (Optimal)</strong>",
            preset_optimal_title: "🌟 حالت بهینه و پیشنهادی (۱۵٪)",
            preset_optimal_desc: "بهترین تعادل بین کشف پوسیدگی‌ها و عدم ایجاد خطای کاذب",
            preset_high_title: "🔍 حساسیت بالا (۸٪)",
            preset_high_desc: "ردیابی تمام کانون‌های ریز و مشکوک اولیه",
            preset_strict_title: "🛡️ حالت سخت‌گیرانه (۲۵٪)",
            preset_strict_desc: "فقط نمایش پاتولوژی‌های قطعی و کاملاً پیشرفته",
            bound_sensitive: "۵٪ (بسیار حساس)",
            bound_strict: "۳۵٪ (سخت‌گیرانه)",
            slider_explanation: "💡 <strong>راهنما:</strong> مدل با حساسیت پیشنهادی <strong>۱۵٪</strong> به طور خودکار عوارض را به تفکیک هر دندان ارزیابی می‌کند. با حرکت دادن اسلایدر می‌توانید حساسیت را به دلخواه تغییر دهید.",
            status_title: "در حال بررسی رادیوگرافی و پردازش مدل هوش مصنوعی...",
            status_desc: "افزایش وضوح، مکان‌یابی دقیق کانون عارضه دور تک‌دندان و محاسبه احتمالات",
            diag_tag: "ارزیابی کلی وضعیت فک و دندان",
            metric_confidence: "میانگین احتمال درستی",
            metric_confidence_sub: "اطمینان تشخیصی",
            metric_error: "میانگین احتمال خطا",
            metric_error_sub: "حاشیه عدم قطعیت",
            metric_findings: "دندان‌های دارای عارضه",
            metric_findings_sub: "دندان نیازمند توجه",
            boxes_title: "مکان‌یابی کانون عارضه روی رادیوگرافی (OPG Bounding Boxes)",
            boxes_desc: "کادر دور همان دندان آسیب‌دیده با اندازه دقیق کشیده شده و شماره دندان FDI درج شده است.",
            btn_toggle_clean: "🔄 نمایش تصویر خام بدون کادر",
            btn_toggle_boxes: "🎯 نمایش کادرهای هوشمند دور دندان",
            cap_caries: "قرمز: پوسیدگی دندان (Caries)",
            cap_restoration: "آبی: ترمیم و پرکردگی (Restoration)",
            cap_impacted: "نارنجی: دندان نهفته در فک (Impacted)",
            cap_periapical: "بنفش: ضایعه و کیست ریشه (Periapical)",
            cap_sound: "سبز: ساختار طبیعی دندان (Sound)",
            odontogram_title: "🦷 نقشه تعاملی ۳۲ دندان دائمی — استاندارد جهانی FDI",
            odontogram_desc: "روی هر دندان کلیک کنید تا نام، شماره FDI و وضعیت کامل آن نمایش داده شود. رنگ هر دندان نشان‌دهنده وضعیت بالینی آن است.",
            leg_sound: "سالم",
            leg_caries: "پوسیدگی",
            leg_restoration: "ترمیم/پرکردگی",
            leg_impacted: "دندان نهفته",
            leg_periapical: "ضایعه ریشه",
            leg_outofview: "خارج از تصویر",
            tooth_location_prompt: "کجای دندان ایراد دارد؟",
            tooth_treatment_prompt: "اقدام پیشنهادی دندانپزشکی:",
            conf_title: "احتمال درستی",
            err_title: "احتمال خطا",
            fdi_guide_title: "راهنمای سیستم نام‌گذاری و شماره‌گذاری دندان‌ها (استاندارد جهانی FDI):",
            fdi_guide_sub: "در علم دندانپزشکی، به‌جای شماره‌گذاری تصادفی، از سیستم استاندارد دو رقمی فدراسیون بین‌المللی دندانپزشکی (FDI World Dental Federation) استفاده می‌شود:",
            fdi_col1_title: "🔢 رقم اول: موقعیت ربع فک (Quadrant)",
            fdi_q1: "<strong>ربع ۱ (۱۰+):</strong> فک بالا - سمت راست بیمار (دندان‌های ۱۱ تا ۱۸)",
            fdi_q2: "<strong>ربع ۲ (۲۰+):</strong> فک بالا - سمت چپ بیمار (دندان‌های ۲۱ تا ۲۸)",
            fdi_q3: "<strong>ربع ۳ (۳۰+):</strong> فک پایین - سمت چپ بیمار (دندان‌های ۳۱ تا ۳۸)",
            fdi_q4: "<strong>ربع ۴ (۴۰+):</strong> فک پایین - سمت راست بیمار (دندان‌های ۴۱ تا ۴۸)",
            fdi_col2_title: "🦷 رقم دوم: نوع و موقعیت دندان (از جلو به عقب)",
            fdi_pos1: "<strong>۱ و ۲:</strong> دندان‌های پیشین (ثنایای مرکزی و کناری) — تک‌ریشه",
            fdi_pos2: "<strong>۳:</strong> دندان نیش (کانین) — بلندترین تک‌ریشه قوس فکی",
            fdi_pos3: "<strong>۴ و ۵:</strong> دندان‌های پره‌مولر اول و دوم (آسیای کوچک) — دو ریشه",
            fdi_pos4: "<strong>۶ و ۷ و ۸:</strong> دندان‌های آسیای بزرگ (مولار اول، دوم و عقل) — ۲ الی ۳ ریشه",
            table_title: "جدول تفکیکی عوارض، درصد احتمال درستی و خطا، و محل دقیق عارضه",
            table_desc: "تفکیک دقیق موضع آسیب در مینا، عاج، پالپ عصب، ریشه و استخوان فک به زبان فارسی",
            th_tooth: "شماره و نام دندان",
            th_pathology: "نوع بیماری / عارضه",
            th_location: "کجای دندان ایراد دارد؟ (محل دقیق آناتومیک)",
            th_confidence: "درصد احتمال درستی",
            th_error: "درصد احتمال خطا",
            th_treatment: "طرح درمان پیشنهادی",
            table_empty: "✨ هیچ ناهنجاری بالینی در رادیوگرافی مشاهده نشد؛ تمام دندان‌ها در وضعیت سالم و طبیعی قرار دارند.",
            crops_title: "برش‌های زوم‌شده دندان‌های دارای عارضه (Zoomed Findings)",
            crops_desc: "بزرگنمایی دقیق از هر دندان آسیب‌دیده برای بررسی بافت مینا و ریشه",
            report_title: "کارنامه بالینی و گزارش رسمی رادیولوژی دندان",
            report_desc: "خلاصه مستند وضعیت دندان‌های بیمار با امکان چاپ مستقیم یا ذخیره به صورت PDF",
            print_btn: "🖨️ چاپ / ذخیره گزارش رسمی PDF",
            footer_text: "DentalAI Studio Pro • سامانه هوشمند تحلیل رادیوگرافی پانورامیک دندان (OPG) بر اساس استاندارد جهانی FDI (نسخه آزمایشی v0.1)"
        }
    };

    // =========================================================================
    // Language Switcher Controller
    // =========================================================================
    function setLanguage(lang) {
        currentLang = (lang === "fa") ? "fa" : "en";
        localStorage.setItem("dentalai_lang", currentLang);

        document.documentElement.lang = currentLang;
        document.documentElement.dir = (currentLang === "fa") ? "rtl" : "ltr";

        if (langEnBtn) langEnBtn.classList.toggle("active", currentLang === "en");
        if (langFaBtn) langFaBtn.classList.toggle("active", currentLang === "fa");

        // Update all data-i18n DOM elements
        const dict = I18N[currentLang];
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (dict[key]) {
                el.innerHTML = dict[key];
            }
        });

        // Update slider value badge
        updateSliderUI(parseInt(confSlider.value, 10));

        // Re-render results if an analysis is active
        if (lastAnalysisResult) {
            renderResults(lastAnalysisResult);
            if (currentSelectedTooth) {
                selectTooth(currentSelectedTooth);
            }
        }
    }

    if (langEnBtn) langEnBtn.addEventListener("click", () => setLanguage("en"));
    if (langFaBtn) langFaBtn.addEventListener("click", () => setLanguage("fa"));

    // =========================================================================
    // Modality & Sensitivity Handlers
    // =========================================================================
    modBtns.forEach(btn => {
        if (!btn) return;
        btn.addEventListener("click", () => {
            modBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentModality = btn.dataset.mod || "auto";
            if (currentImageData) {
                const threshold = parseInt(confSlider.value, 10) / 100.0;
                analyzeImage(currentImageData, currentFilename, threshold);
            }
        });
    });

    confSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        updateSliderUI(val);

        if (currentImageData) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                analyzeImage(currentImageData, currentFilename, val / 100.0);
            }, 300);
        }
    });

    function updateSliderUI(val) {
        confSlider.value = val;
        presetBtns.forEach(btn => btn.classList.remove("active"));

        if (currentLang === "fa") {
            if (val === 15) {
                sliderValueBadge.innerText = "۱۵٪ (پیشنهادی و بهینه)";
                presetOptimalBtn.classList.add("active");
            } else if (val <= 9) {
                sliderValueBadge.innerText = `${val}٪ (حساسیت بالا)`;
                presetHighBtn.classList.add("active");
            } else if (val >= 23) {
                sliderValueBadge.innerText = `${val}٪ (سخت‌گیرانه)`;
                presetConservativeBtn.classList.add("active");
            } else {
                sliderValueBadge.innerText = `${val}٪`;
            }
        } else {
            if (val === 15) {
                sliderValueBadge.innerText = "15% (Optimal & Recommended)";
                presetOptimalBtn.classList.add("active");
            } else if (val <= 9) {
                sliderValueBadge.innerText = `${val}% (High Sensitivity)`;
                presetHighBtn.classList.add("active");
            } else if (val >= 23) {
                sliderValueBadge.innerText = `${val}% (Strict / Conservative)`;
                presetConservativeBtn.classList.add("active");
            } else {
                sliderValueBadge.innerText = `${val}%`;
            }
        }
    }

    presetOptimalBtn.addEventListener("click", () => {
        updateSliderUI(15);
        if (currentImageData) analyzeImage(currentImageData, currentFilename, 0.15);
    });

    presetHighBtn.addEventListener("click", () => {
        updateSliderUI(8);
        if (currentImageData) analyzeImage(currentImageData, currentFilename, 0.08);
    });

    presetConservativeBtn.addEventListener("click", () => {
        updateSliderUI(25);
        if (currentImageData) analyzeImage(currentImageData, currentFilename, 0.25);
    });

    // =========================================================================
    // Drag & Drop / File Upload
    // =========================================================================
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Clinical Sample Buttons
    if (sampleBitewing1Btn) {
        sampleBitewing1Btn.addEventListener("click", () => loadSample("bitewing_1", currentLang === "fa" ? "نمونه ۱ بایت‌وینگ (پوسیدگی‌های پروگزیمال)..." : "Loading Sample 1 (Right Bitewing Proximal Caries)..."));
    }
    if (sampleBitewing2Btn) {
        sampleBitewing2Btn.addEventListener("click", () => loadSample("bitewing_2", currentLang === "fa" ? "نمونه ۲ بایت‌وینگ (ترمیم‌های وسیع)..." : "Loading Sample 2 (Left Bitewing Restorations)..."));
    }
    if (sampleClinical1Btn) {
        sampleClinical1Btn.addEventListener("click", () => loadSample("clinical_1", currentLang === "fa" ? "نمونه ۳ OPG (پوسیدگی‌ها و ضایعه ریشه)..." : "Loading Sample 3 (Panoramic OPG Pathology)..."));
    }
    if (sampleNormalBtn) {
        sampleNormalBtn.addEventListener("click", () => loadSample("normal", currentLang === "fa" ? "نمونه ۴ (دندان‌های سالم)..." : "Loading Sample 4 (Healthy Sound Dentition)..."));
    }

    // Toggle Raw vs Bounding Box View
    toggleViewBtn.addEventListener("click", () => {
        if (!lastAnalysisResult) return;
        isShowingClean = !isShowingClean;
        if (isShowingClean) {
            boxedImage.src = lastAnalysisResult.clean_img;
            toggleViewBtn.innerText = currentLang === "fa" ? "🎯 نمایش کادرهای هوشمند دور دندان" : "🎯 Show AI Bounding Boxes";
            toggleViewBtn.classList.add("btn-primary");
            toggleViewBtn.classList.remove("btn-outline");
        } else {
            boxedImage.src = lastAnalysisResult.boxed_img;
            toggleViewBtn.innerText = currentLang === "fa" ? "🔄 نمایش تصویر خام بدون کادر" : "🔄 Show Raw Image Without Boxes";
            toggleViewBtn.classList.remove("btn-primary");
            toggleViewBtn.classList.add("btn-outline");
        }
    });

    function handleFileUpload(file) {
        const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
        const isImage = file.type.startsWith("image/");

        if (!isImage && !isPdf) {
            alert(currentLang === "fa" ? "لطفاً یک تصویر رادیوگرافی (JPG, PNG) یا فایل PDF انتخاب کنید." : "Please select a dental X-ray image (JPG, PNG) or PDF document.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            currentImageData = e.target.result;
            currentFilename = file.name;
            const threshold = parseInt(confSlider.value, 10) / 100.0;
            analyzeImage(currentImageData, currentFilename, threshold);
        };
        reader.readAsDataURL(file);
    }

    function loadSample(type, msg) {
        showLoading(msg);
        fetch(`/api/sample?type=${type}`)
            .then(res => res.json())
            .then(data => {
                currentImageData = data.image_base64;
                currentFilename = data.filename;
                const threshold = parseInt(confSlider.value, 10) / 100.0;
                analyzeImage(currentImageData, currentFilename, threshold);
            })
            .catch(err => {
                hideLoading();
                alert((currentLang === "fa" ? "خطا در بارگذاری نمونه: " : "Error loading sample: ") + err);
            });
    }

    function showLoading(msg) {
        statusCard.style.display = "flex";
        const defaultMsg = currentLang === "fa" ? "در حال پردازش رادیوگرافی با مدل هوش مصنوعی..." : "Analyzing radiograph with AI deep learning model...";
        document.getElementById("statusTitle").innerText = msg || defaultMsg;
        resultsSection.style.display = "none";
    }

    function hideLoading() {
        statusCard.style.display = "none";
    }

    function analyzeImage(base64Image, filename, threshold = 0.15) {
        showLoading();

        fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image: base64Image,
                filename: filename,
                conf_threshold: threshold,
                modality: currentModality
            })
        })
        .then(res => {
            if (!res.ok) throw new Error(currentLang === "fa" ? "پاسخ سرور ناموفق بود." : "Server response failed.");
            return res.json();
        })
        .then(data => {
            hideLoading();
            lastAnalysisResult = data;
            isShowingClean = false;
            toggleViewBtn.innerText = currentLang === "fa" ? "🔄 نمایش تصویر خام بدون کادر" : "🔄 Show Raw Image Without Boxes";
            toggleViewBtn.classList.remove("btn-primary");
            toggleViewBtn.classList.add("btn-outline");
            renderResults(data);
        })
        .catch(err => {
            hideLoading();
            alert((currentLang === "fa" ? "خطا در تحلیل تصویر: " : "Analysis error: ") + err.message);
        });
    }

    // =========================================================================
    // Results Rendering Engine
    // =========================================================================
    function renderResults(data) {
        resultsSection.style.display = "block";

        const diagCard = document.getElementById("diagnosisCard");
        const diagTitle = document.getElementById("diagTitle");
        const diagTag = document.getElementById("diagTag");
        const diagSummary = document.getElementById("diagSummary");

        const confidenceValue = document.getElementById("confidenceValue");
        const confidenceBar = document.getElementById("confidenceBar");
        const errorValue = document.getElementById("errorValue");
        const errorBar = document.getElementById("errorBar");
        const findingsCountValue = document.getElementById("findingsCountValue");

        diagCard.className = "card diagnosis-card " + (data.is_pathology ? "abnormal" : "normal");

        const avgConf = data.overall_confidence_pct;
        const avgErr = data.overall_error_pct;
        const count = data.findings_count;

        confidenceValue.innerText = `${avgConf}%`;
        confidenceBar.style.width = `${Math.min(100, avgConf)}%`;

        errorValue.innerText = `${avgErr}%`;
        errorBar.style.width = `${Math.min(100, avgErr)}%`;

        findingsCountValue.innerText = (currentLang === "fa") ? `${count} مورد` : `${count}`;

        const modTitle = (currentLang === "fa") ? (data.modality_title || "تحلیل هوشمند رادیوگرافی") : (data.modality_title_en || (data.modality === "bitewing" ? "Intraoral Bitewing Radiograph" : "Panoramic OPG Radiograph"));
        diagTag.innerText = modTitle;

        if (data.is_pathology) {
            if (currentLang === "fa") {
                diagTitle.innerText = `تشخیص بالینی: شناسایی ${count} کانون ناهنجاری نیازمند درمان (${data.modality === 'bitewing' ? 'پوسیدگی‌های بین‌دندانی پروگزیمال' : 'پاتولوژی دندان'})`;
                diagSummary.innerText = `سیستم هوش مصنوعی بر اساس ردیابی کانون‌های پاتولوژی در ${modTitle}، تعداد ${count} عارضه نیازمند اقدام درمانی را شناسایی و مکان‌یابی کرده است. احتمال درستی تشخیصی سیستم ${avgConf}% و ضریب عدم قطعیت آماری ${avgErr}% برآورد گردیده است.`;
            } else {
                diagTitle.innerText = `Clinical Evaluation: Identified ${count} pathological finding(s) requiring attention (${data.modality === 'bitewing' ? 'Interproximal Caries' : 'Dental Pathology'})`;
                diagSummary.innerText = `AI analysis on ${modTitle} detected ${count} lesion locus/loci requiring professional dental attention. Mean diagnostic certainty is calibrated at ${avgConf}% with a statistical uncertainty margin of ${avgErr}%.`;
            }
        } else {
            if (currentLang === "fa") {
                diagTitle.innerText = "تشخیص بالینی: ساختار دندان‌ها سالم و طبیعی (Sound Dentition)";
                diagSummary.innerText = `سیستم هوش مصنوعی با اطمینان ${avgConf}% و ضریب عدم قطعیت ${avgErr}%، ساختار دندان‌ها و استخوان را در محدوده طبیعی ارزیابی نموده و هیچ پوسیدگی فعالی مشاهده نگردید.`;
            } else {
                diagTitle.innerText = "Clinical Evaluation: Sound Dentition (No Active Pathologies Detected)";
                diagSummary.innerText = `AI evaluation confirmed coronal enamel, dentin, and alveolar bone structures are within normal clinical thresholds with ${avgConf}% diagnostic certainty.`;
            }
        }

        boxedImage.src = data.boxed_img;
        document.getElementById("roiCountPill").innerText = (currentLang === "fa") ? `${count} عارضه مشخص شد` : `${count} finding${count === 1 ? '' : 's'} localized`;

        renderOdontogram(data.odontogram);
        renderFindingsTable(data.detected_findings);
        renderCrops(data.crops);
        renderReport(data);

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // =========================================================================
    // SVG Odontogram Generator (32-Tooth FDI Standard)
    // =========================================================================
    const TOOTH_TYPES = {
        'molar':    { cw: 36, ch: 28, rh: 42, roots: 3 },
        'premolar': { cw: 26, ch: 24, rh: 36, roots: 2 },
        'canine':   { cw: 22, ch: 26, rh: 44, roots: 1 },
        'incisor':  { cw: 20, ch: 22, rh: 36, roots: 1 }
    };

    function getToothTypeKey(fdi) {
        const n = fdi % 10;
        if (n === 8 || n === 7 || n === 6) return 'molar';
        if (n === 5 || n === 4) return 'premolar';
        if (n === 3) return 'canine';
        return 'incisor';
    }

    function renderOdontogram(odontogram) {
        const svg = document.getElementById("toothSVGChart");
        svg.innerHTML = "";

        const upperFDI = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
        const lowerFDI = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

        const GAP = 3;
        const PADDING_X = 12;
        const UPPER_Y_BASE = 10;
        const LOWER_Y_BASE = 160;

        let x = PADDING_X;
        const upperX = {};
        upperFDI.forEach(f => {
            upperX[f] = x;
            x += TOOTH_TYPES[getToothTypeKey(f)].cw + GAP;
        });
        const totalWidth = x + PADDING_X;

        x = PADDING_X;
        const lowerX = {};
        lowerFDI.forEach(f => {
            lowerX[f] = x;
            x += TOOTH_TYPES[getToothTypeKey(f)].cw + GAP;
        });

        svg.setAttribute("viewBox", `0 0 ${totalWidth} 290`);

        // Midline between upper & lower jaws
        const midLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        midLine.setAttribute("x1", PADDING_X - 4);
        midLine.setAttribute("y1", 148);
        midLine.setAttribute("x2", totalWidth - PADDING_X + 4);
        midLine.setAttribute("y2", 148);
        midLine.setAttribute("stroke", "#cbd5e1");
        midLine.setAttribute("stroke-width", "1.5");
        midLine.setAttribute("stroke-dasharray", "4 3");
        svg.appendChild(midLine);

        // Jaw labels
        const labelUpper = document.createElementNS("http://www.w3.org/2000/svg", "text");
        labelUpper.setAttribute("x", totalWidth / 2);
        labelUpper.setAttribute("y", 147);
        labelUpper.setAttribute("text-anchor", "middle");
        labelUpper.setAttribute("font-size", "9");
        labelUpper.setAttribute("fill", "#94a3b8");
        labelUpper.setAttribute("font-family", currentLang === "fa" ? "Vazirmatn, Arial" : "-apple-system, sans-serif");
        labelUpper.textContent = (currentLang === "fa") ? "▲ فک بالا (ماگزیلا)" : "▲ Upper Jaw (Maxilla)";
        svg.appendChild(labelUpper);

        const labelLower = document.createElementNS("http://www.w3.org/2000/svg", "text");
        labelLower.setAttribute("x", totalWidth / 2);
        labelLower.setAttribute("y", 161);
        labelLower.setAttribute("text-anchor", "middle");
        labelLower.setAttribute("font-size", "9");
        labelLower.setAttribute("fill", "#94a3b8");
        labelLower.setAttribute("font-family", currentLang === "fa" ? "Vazirmatn, Arial" : "-apple-system, sans-serif");
        labelLower.textContent = (currentLang === "fa") ? "▼ فک پایین (مندیبل)" : "▼ Lower Jaw (Mandible)";
        svg.appendChild(labelLower);

        // Vertical midline
        const midXUpper = (upperX[11] + TOOTH_TYPES[getToothTypeKey(11)].cw + upperX[21]) / 2;
        const midVLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        midVLine.setAttribute("x1", midXUpper);
        midVLine.setAttribute("y1", 10);
        midVLine.setAttribute("x2", midXUpper);
        midVLine.setAttribute("y2", 285);
        midVLine.setAttribute("stroke", "#e2e8f0");
        midVLine.setAttribute("stroke-width", "1");
        midVLine.setAttribute("stroke-dasharray", "3 4");
        svg.appendChild(midVLine);

        // Quadrant labels
        const qLabels = (currentLang === "fa") ? [
            { text: "ربع ۱ (بالا راست)", x: (PADDING_X + midXUpper)/2, y: 10, anchor: "middle" },
            { text: "ربع ۲ (بالا چپ)", x: (midXUpper + totalWidth - PADDING_X)/2, y: 10, anchor: "middle" },
            { text: "ربع ۴ (پایین راست)", x: (PADDING_X + midXUpper)/2, y: 285, anchor: "middle" },
            { text: "ربع ۳ (پایین چپ)", x: (midXUpper + totalWidth - PADDING_X)/2, y: 285, anchor: "middle" },
        ] : [
            { text: "Q1 • Upper Right", x: (PADDING_X + midXUpper)/2, y: 10, anchor: "middle" },
            { text: "Q2 • Upper Left", x: (midXUpper + totalWidth - PADDING_X)/2, y: 10, anchor: "middle" },
            { text: "Q4 • Lower Right", x: (PADDING_X + midXUpper)/2, y: 285, anchor: "middle" },
            { text: "Q3 • Lower Left", x: (midXUpper + totalWidth - PADDING_X)/2, y: 285, anchor: "middle" },
        ];

        qLabels.forEach(q => {
            const ql = document.createElementNS("http://www.w3.org/2000/svg", "text");
            ql.setAttribute("x", q.x);
            ql.setAttribute("y", q.y);
            ql.setAttribute("text-anchor", q.anchor);
            ql.setAttribute("font-size", "8.5");
            ql.setAttribute("fill", "#94a3b8");
            ql.setAttribute("font-family", currentLang === "fa" ? "Vazirmatn, Arial" : "-apple-system, sans-serif");
            ql.textContent = q.text;
            svg.appendChild(ql);
        });

        // Upper teeth
        upperFDI.forEach(fdi => {
            const tooth = odontogram[fdi] || null;
            const tk = getToothTypeKey(fdi);
            const td = TOOTH_TYPES[tk];
            const tx = upperX[fdi];
            const rootTop = UPPER_Y_BASE + 18;
            const rootBot = rootTop + td.rh;
            const crownTop = rootBot;
            const crownBot = crownTop + td.ch;
            drawTooth(svg, fdi, tooth, tx, td, rootTop, rootBot, crownTop, crownBot, true, odontogram);
        });

        // Lower teeth
        lowerFDI.forEach(fdi => {
            const tooth = odontogram[fdi] || null;
            const tk = getToothTypeKey(fdi);
            const td = TOOTH_TYPES[tk];
            const tx = lowerX[fdi];
            const crownTop = LOWER_Y_BASE;
            const crownBot = crownTop + td.ch;
            const rootTop = crownBot;
            const rootBot = rootTop + td.rh;
            drawTooth(svg, fdi, tooth, tx, td, rootTop, rootBot, crownTop, crownBot, false, odontogram);
        });

        // Highlight first pathological tooth or first tooth
        const firstAbnormal = Object.values(odontogram).find(t => t.status !== 'healthy') || Object.values(odontogram)[0];
        if (firstAbnormal) {
            selectTooth(firstAbnormal);
            const activeTooth = svg.querySelector(`g[data-fdi="${firstAbnormal.fdi}"]`);
            if (activeTooth) highlightSVGTooth(activeTooth);
        }
    }

    function drawTooth(svg, fdi, toothData, tx, td, rootTop, rootBot, crownTop, crownBot, isUpper, odontogram) {
        const inOdontogram = !!toothData;
        const color = inOdontogram ? (toothData.status_color || '#10b981') : '#94a3b8';
        const colorAlpha = inOdontogram ? hexToRGBA(color, 0.18) : hexToRGBA('#94a3b8', 0.1);
        const colorBorder = inOdontogram ? color : '#94a3b8';

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "svg-tooth-group");
        g.setAttribute("data-fdi", fdi);
        g.style.cursor = "pointer";

        // Draw Roots
        const numRoots = td.roots;
        const rootWidth = (td.cw - 4) / numRoots;
        for (let r = 0; r < numRoots; r++) {
            const rx = tx + 2 + r * rootWidth;
            const rootY = isUpper ? rootTop : rootTop;
            const rootH = td.rh;
            const rootRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rootRect.setAttribute("x", rx + 1.5);
            rootRect.setAttribute("y", rootY);
            rootRect.setAttribute("width", Math.max(2, rootWidth - 3));
            rootRect.setAttribute("height", rootH);
            rootRect.setAttribute("rx", "2");
            rootRect.setAttribute("fill", colorAlpha);
            rootRect.setAttribute("stroke", colorBorder);
            rootRect.setAttribute("stroke-width", "1");
            g.appendChild(rootRect);
        }

        // Draw Crown
        const crown = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        crown.setAttribute("class", "tooth-crown");
        crown.setAttribute("x", tx);
        crown.setAttribute("y", crownTop);
        crown.setAttribute("width", td.cw);
        crown.setAttribute("height", td.ch);
        crown.setAttribute("rx", "4");
        crown.setAttribute("fill", colorAlpha);
        crown.setAttribute("stroke", colorBorder);
        crown.setAttribute("stroke-width", "1.6");
        g.appendChild(crown);

        // FDI Number Label
        const numEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        numEl.setAttribute("x", tx + td.cw / 2);
        numEl.setAttribute("y", crownTop + td.ch / 2 + 3.5);
        numEl.setAttribute("text-anchor", "middle");
        numEl.setAttribute("font-size", "9.5");
        numEl.setAttribute("font-weight", "bold");
        numEl.setAttribute("fill", inOdontogram && toothData.status !== 'healthy' ? color : '#334155');
        numEl.setAttribute("font-family", "Arial, sans-serif");
        numEl.textContent = fdi;
        g.appendChild(numEl);

        // Status Indicator Dot for abnormalities
        if (inOdontogram && toothData.status !== 'healthy') {
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", tx + td.cw - 3);
            dot.setAttribute("cy", isUpper ? crownTop + 4 : crownBot - 4);
            dot.setAttribute("r", "2.8");
            dot.setAttribute("fill", color);
            dot.setAttribute("stroke", "#ffffff");
            dot.setAttribute("stroke-width", "0.8");
            g.appendChild(dot);
        }

        // Tooltip
        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        const toothDisplayName = currentLang === "fa" ? (toothData ? toothData.name : `دندان #${fdi}`) : (toothData ? toothData.name_en : `Tooth #${fdi}`);
        const statusDisplay = toothData ? ((currentLang === "fa") ? toothData.status_label : (toothData.status_label_en || toothData.status_label)) : "";
        title.textContent = `#${fdi} ${toothDisplayName} • ${statusDisplay}`;
        g.appendChild(title);

        g.addEventListener("click", () => {
            highlightSVGTooth(g);
            if (toothData) {
                selectTooth(toothData);
            }
        });

        svg.appendChild(g);
    }

    function highlightSVGTooth(g) {
        document.querySelectorAll(".svg-tooth-group .tooth-crown").forEach(c => {
            c.setAttribute("stroke-width", "1.6");
        });
        const crown = g.querySelector(".tooth-crown");
        if (crown) {
            crown.setAttribute("stroke-width", "2.8");
        }
    }

    function hexToRGBA(hex, alpha) {
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function selectTooth(tooth) {
        currentSelectedTooth = tooth;
        const box = document.getElementById("selectedToothBox");
        box.style.display = "flex";

        const badge = document.getElementById("toothDetailBadge");
        badge.innerText = `#${tooth.fdi}`;
        badge.style.background = tooth.status_color || '#10b981';

        document.getElementById("toothDetailTitle").innerText = (currentLang === "fa") ? tooth.name : tooth.name_en;

        const typeEl = document.getElementById("toothDetailType");
        if (typeEl) {
            typeEl.innerText = (currentLang === "fa") ? (tooth.type || "") : (tooth.type_en || "");
        }

        document.getElementById("toothDetailQuadrant").innerText = (currentLang === "fa") ? (tooth.quadrant_fa || "فک") : (tooth.quadrant_en || `Quadrant ${tooth.quadrant}`);

        const statusPill = document.getElementById("toothDetailStatus");
        statusPill.innerText = (currentLang === "fa") ? tooth.status_label : (tooth.status_label_en || tooth.status_label);
        const isHealthy = (tooth.status === 'healthy');
        statusPill.style.background = isHealthy ? '#d1fae5' : hexToRGBA(tooth.status_color || '#ef4444', 0.15);
        statusPill.style.color = isHealthy ? '#059669' : (tooth.status_color || '#dc2626');
        statusPill.style.border = `1px solid ${isHealthy ? '#6ee7b7' : (tooth.status_color || '#ef4444')}`;

        document.getElementById("toothDetailLocation").innerText = (currentLang === "fa") ? (tooth.anatomical_location || "تاج و ریشه طبیعی") : (tooth.anatomical_location_en || "Intact crown and root structure");
        document.getElementById("toothDetailDesc").innerText = (currentLang === "fa") ? tooth.finding : (tooth.finding_en || tooth.finding);
        document.getElementById("toothDetailTreatment").innerText = (currentLang === "fa") ? (tooth.treatment || "چکاپ دوره‌ای ۶ ماهه") : (tooth.treatment_en || "Routine 6-month preventive maintenance");

        const conf = tooth.confidence_pct || 97.5;
        const err = tooth.error_pct || 2.5;

        document.getElementById("toothDetailConf").innerText = `${conf.toFixed(1)}%`;
        document.getElementById("toothDetailErr").innerText = `${err.toFixed(1)}%`;
    }

    function renderFindingsTable(findings) {
        const tbody = document.getElementById("findingsTableBody");
        tbody.innerHTML = "";

        if (!findings || findings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--success); font-weight: 800; padding: 2rem;">
                        ${I18N[currentLang].table_empty}
                    </td>
                </tr>
            `;
            return;
        }

        findings.forEach(f => {
            const tr = document.createElement("tr");
            const tName = (currentLang === "fa") ? f.tooth_name : f.tooth_name_en;
            const pShort = (currentLang === "fa") ? f.pathology_short : (f.pathology_short_en || f.pathology_short);
            const pLabel = (currentLang === "fa") ? f.pathology_label : (f.pathology_label_en || f.pathology_label);
            const aLoc = (currentLang === "fa") ? f.anatomical_location : (f.anatomical_location_en || f.anatomical_location);
            const reliab = (currentLang === "fa") ? f.reliability : (f.reliability_en || "High Confidence");
            const treat = (currentLang === "fa") ? f.treatment : (f.treatment_en || f.treatment);

            tr.innerHTML = `
                <td>
                    <strong>#${f.fdi}</strong> - ${tName}
                </td>
                <td>
                    <span style="color: ${f.color_hex}; font-weight: 800;">● ${pShort}</span>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${pLabel}</div>
                </td>
                <td>
                    <strong style="color: var(--primary);">${aLoc}</strong>
                </td>
                <td>
                    <span class="prob-badge-success">${f.confidence_pct}%</span>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${reliab}</div>
                </td>
                <td>
                    <span class="prob-badge-error">${f.error_pct}%</span>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${currentLang === "fa" ? 'عدم قطعیت آماری' : 'Risk Margin'}</div>
                </td>
                <td style="font-size: 0.82rem; color: var(--text-secondary);">
                    ${treat}
                </td>
            `;

            tr.addEventListener("click", () => {
                const toothGroup = document.querySelector(`.svg-tooth-group[data-fdi="${f.fdi}"]`);
                if (toothGroup) toothGroup.dispatchEvent(new Event('click'));
            });

            tbody.appendChild(tr);
        });
    }

    function renderCrops(crops) {
        const cropsCard = document.getElementById("cropsCard");
        const cropsGallery = document.getElementById("cropsGallery");
        cropsGallery.innerHTML = "";

        if (crops && crops.length > 0) {
            cropsCard.style.display = "block";
            crops.forEach(crop => {
                const item = document.createElement("div");
                item.className = "crop-item";
                const label = (currentLang === "fa") ? crop.label : (crop.label_en || crop.label);
                const loc = (currentLang === "fa") ? crop.anatomical_location : (crop.anatomical_location_en || crop.anatomical_location);
                const desc = (currentLang === "fa") ? crop.description : (crop.description_en || crop.description);

                item.innerHTML = `
                    <img src="${crop.image}" alt="${label}">
                    <div class="crop-header">
                        <span class="crop-title">${label}</span>
                        <div class="crop-probs">
                            <span class="prob-badge-success">${crop.confidence_pct}%</span>
                            <span class="prob-badge-error">${crop.error_pct}%</span>
                        </div>
                    </div>
                    <div class="crop-location">${currentLang === "fa" ? 'محل عارضه: ' : 'Site: '}${loc}</div>
                    <div class="crop-desc">${desc}</div>
                `;
                cropsGallery.appendChild(item);
            });
        } else {
            cropsCard.style.display = "none";
        }
    }

    function renderReport(data) {
        const reportContent = document.getElementById("reportContent");
        const now = (currentLang === "fa") ? new Date().toLocaleDateString('fa-IR') : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        let findingsRows = "";
        if (data.detected_findings && data.detected_findings.length > 0) {
            findingsRows = data.detected_findings.map(f => {
                const tName = (currentLang === "fa") ? f.tooth_name : f.tooth_name_en;
                const pShort = (currentLang === "fa") ? f.pathology_short : (f.pathology_short_en || f.pathology_short);
                const aLoc = (currentLang === "fa") ? f.anatomical_location : (f.anatomical_location_en || f.anatomical_location);
                const treat = (currentLang === "fa") ? f.treatment : (f.treatment_en || f.treatment);
                return `
                    <tr>
                        <td><strong>#${f.fdi}</strong> (${tName})</td>
                        <td><span style="color: ${f.color_hex}; font-weight: bold;">${pShort}</span></td>
                        <td><strong>${aLoc}</strong></td>
                        <td style="color: var(--success); font-weight: bold;">${f.confidence_pct}%</td>
                        <td style="color: var(--danger); font-weight: bold;">${f.error_pct}%</td>
                        <td>${treat}</td>
                    </tr>
                `;
            }).join("");
        } else {
            findingsRows = `<tr><td colspan="6" style="text-align: center; color: var(--success); font-weight: bold;">${currentLang === "fa" ? 'کلیه ۳۲ دندان دارای ساختار طبیعی رادیوگرافیک و بدون عارضه حاد هستند.' : 'All 32 teeth demonstrate sound radiographic structure within normal limits.'}</td></tr>`;
        }

        if (currentLang === "fa") {
            reportContent.innerHTML = `
                <table class="report-table">
                    <tr>
                        <th>تاریخ پایش بالینی هوشمند</th>
                        <td>${now}</td>
                        <th>شناسه فایل رادیوگرافی</th>
                        <td>${data.filename || 'OPG_Scan.jpg'}</td>
                    </tr>
                    <tr>
                        <th>نتیجه بررسی رادیولوژی</th>
                        <td><strong>${data.is_pathology ? 'دارای عوارض نیازمند توجه دندانپزشکی' : 'ساختار دندان و استخوان سالم'}</strong></td>
                        <th>تعداد دندان‌های دارای عارضه</th>
                        <td>${data.findings_count} دندان</td>
                    </tr>
                    <tr>
                        <th>میانگین احتمال درستی</th>
                        <td style="color: var(--success); font-weight: 800;">${data.overall_confidence_pct}%</td>
                        <th>میانگین حاشیه خطا و ریسک</th>
                        <td style="color: var(--danger); font-weight: 800;">${data.overall_error_pct}%</td>
                    </tr>
                    <tr>
                        <th>موتور هوش مصنوعی</th>
                        <td>YOLOv8-Dental Clinical Detector</td>
                        <th>استاندارد نام‌گذاری و چارتینگ</th>
                        <td>استاندارد جهانی FDI (فدراسیون بین‌المللی دندانپزشکی)</td>
                    </tr>
                </table>

                <h4 style="margin: 1.25rem 0 0.5rem 0; font-weight: 800;">جدول تفکیکی عوارض بر اساس شماره و موقعیت آناتومیک دندان:</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>شماره و نام دندان</th>
                            <th>نوع عارضه</th>
                            <th>محل دقیق عارضه در دندان</th>
                            <th>احتمال درستی</th>
                            <th>احتمال خطا</th>
                            <th>طرح درمان پیشنهادی</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${findingsRows}
                    </tbody>
                </table>

                <p style="margin-top: 1rem; font-size: 0.82rem; color: #64748b; line-height: 1.7;">
                    <strong>یادداشت بالینی:</strong> این گزارش توسط سامانه هوش مصنوعی DentalAI با مدل اختصاصی YOLOv8 استخراج شده است. این نسخه اولیه (v0.1) جهت پشتیبانی تشخیصی آموزشی است و تصمیم‌گیری نهایی بر عهده دندانپزشک مجرب می‌باشد.
                </p>
            `;
        } else {
            reportContent.innerHTML = `
                <table class="report-table">
                    <tr>
                        <th>Clinical AI Analysis Date</th>
                        <td>${now}</td>
                        <th>Radiograph File ID</th>
                        <td>${data.filename || 'OPG_Scan.jpg'}</td>
                    </tr>
                    <tr>
                        <th>Diagnostic Outcome</th>
                        <td><strong>${data.is_pathology ? 'Pathological Findings Localized (Clinical Attention Required)' : 'Sound Dentition (Within Normal Limits)'}</strong></td>
                        <th>Affected Teeth Count</th>
                        <td>${data.findings_count} tooth/teeth</td>
                    </tr>
                    <tr>
                        <th>Mean Diagnostic Certainty</th>
                        <td style="color: var(--success); font-weight: 800;">${data.overall_confidence_pct}%</td>
                        <th>Statistical Error Margin</th>
                        <td style="color: var(--danger); font-weight: 800;">${data.overall_error_pct}%</td>
                    </tr>
                    <tr>
                        <th>AI Inference Engine</th>
                        <td>YOLOv8-Dental Clinical Detector</td>
                        <th>Tooth Charting Standard</th>
                        <td>FDI World Dental Federation 32-Tooth Two-Digit System</td>
                    </tr>
                </table>

                <h4 style="margin: 1.25rem 0 0.5rem 0; font-weight: 800;">Itemized Pathological Findings by Anatomical Tooth Site:</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Tooth # & Name</th>
                            <th>Pathology / Finding</th>
                            <th>Anatomical Site</th>
                            <th>Certainty %</th>
                            <th>Error Margin %</th>
                            <th>Recommended Management</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${findingsRows}
                    </tbody>
                </table>

                <p style="margin-top: 1rem; font-size: 0.82rem; color: #64748b; line-height: 1.7;">
                    <strong>Clinical Notice:</strong> This report was generated by DentalAI Multi-Modality Studio using fine-tuned YOLOv8 neural networks. This release is an early research prototype (v0.1) for educational and clinical decision support. Final diagnostic and treatment confirmation rests solely with a licensed dental practitioner.
                </p>
            `;
        }
    }

    // Initialize application in default language (English)
    setLanguage(currentLang);
});
