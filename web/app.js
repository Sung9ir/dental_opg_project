document.addEventListener("DOMContentLoaded", () => {
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

    let currentImageData = null;
    let currentFilename = "XRay_Scan.jpg";
    let currentModality = "auto";
    let isShowingClean = false;
    let lastAnalysisResult = null;
    let debounceTimer = null;

    // انتخاب نوع رادیوگرافی (Modality Selector)
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

    // به‌روزرسانی مقدار اسلایدر حساسیت
    confSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        updateSliderUI(val);

        // اجرای مجدد با دیبانس برای جلوگیری از درخواست‌های مکرر
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
    }

    // دکمه‌های حالت‌های از پیش تنظیم‌شده (Presets)
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

    // رویدادهای دراگ و دراپ
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

    // دکمه‌های نمونه‌های بالینی آماده
    if (sampleBitewing1Btn) {
        sampleBitewing1Btn.addEventListener("click", () => loadSample("bitewing_1", "نمونه ۱ بایت‌وینگ (پوسیدگی‌های بین‌دندانی پروگزیمال)..."));
    }
    if (sampleBitewing2Btn) {
        sampleBitewing2Btn.addEventListener("click", () => loadSample("bitewing_2", "نمونه ۲ بایت‌وینگ (ترمیم‌های وسیع فلزی)..."));
    }
    if (sampleClinical1Btn) {
        sampleClinical1Btn.addEventListener("click", () => loadSample("clinical_1", "نمونه OPG پانورامیک (پوسیدگی‌ها و ضایعه ریشه)..."));
    }
    if (sampleNormalBtn) {
        sampleNormalBtn.addEventListener("click", () => loadSample("normal", "نمونه دندان‌های سالم و ساختار طبیعی فک..."));
    }

    // سوئیچ بین تصویر کادرکشی شده و تصویر خام
    toggleViewBtn.addEventListener("click", () => {
        if (!lastAnalysisResult) return;
        isShowingClean = !isShowingClean;
        if (isShowingClean) {
            boxedImage.src = lastAnalysisResult.clean_img;
            toggleViewBtn.innerText = "🎯 نمایش کادرهای هوشمند دور دندان";
            toggleViewBtn.classList.add("btn-primary");
            toggleViewBtn.classList.remove("btn-outline");
        } else {
            boxedImage.src = lastAnalysisResult.boxed_img;
            toggleViewBtn.innerText = "🔄 نمایش تصویر خام بدون کادر";
            toggleViewBtn.classList.remove("btn-primary");
            toggleViewBtn.classList.add("btn-outline");
        }
    });

    function handleFileUpload(file) {
        const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
        const isImage = file.type.startsWith("image/");

        if (!isImage && !isPdf) {
            alert("لطفاً یک تصویر رادیوگرافی (JPG, PNG) یا فایل گزارش PDF انتخاب کنید.");
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
                alert("خطا در بارگذاری نمونه بالینی: " + err);
            });
    }

    function showLoading(msg = "در حال پردازش رادیوگرافی با مدل هوش مصنوعی...") {
        statusCard.style.display = "flex";
        document.getElementById("statusTitle").innerText = msg;
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
            if (!res.ok) throw new Error("پاسخ سرور ناموفق بود.");
            return res.json();
        })
        .then(data => {
            hideLoading();
            lastAnalysisResult = data;
            isShowingClean = false;
            toggleViewBtn.innerText = "🔄 نمایش تصویر خام بدون کادر";
            toggleViewBtn.classList.remove("btn-primary");
            toggleViewBtn.classList.add("btn-outline");
            renderResults(data);
        })
        .catch(err => {
            hideLoading();
            alert("خطا در تحلیل تصویر: " + err.message);
        });
    }

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

        findingsCountValue.innerText = `${count} مورد`;

        diagTag.innerText = data.modality_title || "تحلیل هوشمند رادیوگرافی";

        if (data.is_pathology) {
            diagTitle.innerText = `تشخیص بالینی: شناسایی ${count} کانون ناهنجاری نیازمند درمان (${data.modality === 'bitewing' ? 'پوسیدگی‌های بین‌دندانی پروگزیمال' : 'پاتولوژی دندان'})`;
            diagSummary.innerText = `سیستم هوش مصنوعی بر اساس ردیابی کانون‌های پاتولوژی در ${data.modality_title}، تعداد ${count} عارضه نیازمند اقدام درمانی را شناسایی و مکان‌یابی کرده است. احتمال درستی تشخیصی سیستم ${avgConf}% و ضریب عدم قطعیت آماری ${avgErr}% برآورد گردیده است.`;
        } else {
            diagTitle.innerText = "تشخیص بالینی: ساختار دندان‌ها سالم و طبیعی (Sound Dentition)";
            diagSummary.innerText = `سیستم هوش مصنوعی با اطمینان ${avgConf}% و ضریب عدم قطعیت ${avgErr}%، ساختار دندان‌ها و استخوان را در محدوده طبیعی ارزیابی نموده و هیچ پوسیدگی فعالی مشاهده نگردید.`;
        }

        // تصویر رادیوگرافی با کادرهای رنگی دقیق
        boxedImage.src = data.boxed_img;
        document.getElementById("roiCountPill").innerText = `${count} عارضه مشخص شد`;

        // رندر چارت دندانپزشکی FDI
        renderOdontogram(data.odontogram);

        // جدول تفکیکی محل دقیق عارضه و درصدها
        renderFindingsTable(data.detected_findings);

        // گالری برش‌های بزرگنمایی‌شده
        renderCrops(data.crops);

        // گزارش رسمی بالینی
        renderReport(data);

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // =========================================================================
    // نقشه گرافیکی SVG دندان‌ها — استاندارد FDI
    // =========================================================================
    const TOOTH_TYPES = {
        // نوع دندان → [عرض نسبی، ارتفاع تاج، ارتفاع ریشه، تعداد ریشه]
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
        return 'incisor'; // 1, 2
    }

    function renderOdontogram(odontogram) {
        const svg = document.getElementById("toothSVGChart");
        svg.innerHTML = "";

        // آرایه دندان‌ها از راست به چپ در تصویر:
        // بالا: 18→11 (ربع 1 راست) | 21→28 (ربع 2 چپ)
        // پایین: 48→41 (ربع 4 راست) | 31→38 (ربع 3 چپ)
        const upperFDI = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
        const lowerFDI = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

        // محاسبه عرض کل
        const GAP = 3;
        const PADDING_X = 12;
        const UPPER_Y_BASE = 10;  // بالای SVG تا پایین تاج دندان‌های بالا
        const LOWER_Y_BASE = 160; // بالای تاج دندان‌های پایین

        // ابتدا عرض همه دندان‌ها را محاسبه کن
        const allFDI = [...upperFDI, ...lowerFDI];
        const uniqueFDI = [...new Set(allFDI)];
        const toothWidths = {};
        upperFDI.forEach(f => { toothWidths[f] = TOOTH_TYPES[getToothTypeKey(f)].cw + GAP; });

        // محاسبه موقعیت X هر دندان (بالا)
        let x = PADDING_X;
        const upperX = {};
        upperFDI.forEach(f => {
            upperX[f] = x;
            x += TOOTH_TYPES[getToothTypeKey(f)].cw + GAP;
        });
        const totalWidth = x + PADDING_X;

        // محاسبه موقعیت X دندان‌های پایین (با تراز مشابه)
        x = PADDING_X;
        const lowerX = {};
        lowerFDI.forEach(f => {
            lowerX[f] = x;
            x += TOOTH_TYPES[getToothTypeKey(f)].cw + GAP;
        });

        // تنظیم viewBox بر اساس عرض واقعی
        svg.setAttribute("viewBox", `0 0 ${totalWidth} 290`);

        // --- خط تقسیم فک بالا/پایین ---
        const midLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        midLine.setAttribute("x1", PADDING_X - 4);
        midLine.setAttribute("y1", 148);
        midLine.setAttribute("x2", totalWidth - PADDING_X + 4);
        midLine.setAttribute("y2", 148);
        midLine.setAttribute("stroke", "#cbd5e1");
        midLine.setAttribute("stroke-width", "1.5");
        midLine.setAttribute("stroke-dasharray", "4 3");
        svg.appendChild(midLine);

        // برچسب‌های فک
        const labelUpper = document.createElementNS("http://www.w3.org/2000/svg", "text");
        labelUpper.setAttribute("x", totalWidth / 2);
        labelUpper.setAttribute("y", 147);
        labelUpper.setAttribute("text-anchor", "middle");
        labelUpper.setAttribute("font-size", "9");
        labelUpper.setAttribute("fill", "#94a3b8");
        labelUpper.setAttribute("font-family", "Vazirmatn, Arial");
        labelUpper.textContent = "▲ فک بالا (ماگزیلا)";
        svg.appendChild(labelUpper);

        const labelLower = document.createElementNS("http://www.w3.org/2000/svg", "text");
        labelLower.setAttribute("x", totalWidth / 2);
        labelLower.setAttribute("y", 161);
        labelLower.setAttribute("text-anchor", "middle");
        labelLower.setAttribute("font-size", "9");
        labelLower.setAttribute("fill", "#94a3b8");
        labelLower.setAttribute("font-family", "Vazirmatn, Arial");
        labelLower.textContent = "▼ فک پایین (مندیبل)";
        svg.appendChild(labelLower);

        // خط تقسیم چپ/راست
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

        // برچسب‌های ربع
        const qLabels = [
            { text: "ربع ۱", x: (PADDING_X + midXUpper)/2, y: 10, anchor: "middle" },
            { text: "ربع ۲", x: (midXUpper + totalWidth - PADDING_X)/2, y: 10, anchor: "middle" },
            { text: "ربع ۴", x: (PADDING_X + midXUpper)/2, y: 285, anchor: "middle" },
            { text: "ربع ۳", x: (midXUpper + totalWidth - PADDING_X)/2, y: 285, anchor: "middle" },
        ];
        qLabels.forEach(q => {
            const ql = document.createElementNS("http://www.w3.org/2000/svg", "text");
            ql.setAttribute("x", q.x);
            ql.setAttribute("y", q.y);
            ql.setAttribute("text-anchor", q.anchor);
            ql.setAttribute("font-size", "8.5");
            ql.setAttribute("fill", "#b0bec5");
            ql.setAttribute("font-family", "Vazirmatn, Arial");
            ql.textContent = q.text;
            svg.appendChild(ql);
        });

        // --- رسم دندان‌های بالا ---
        upperFDI.forEach(fdi => {
            const tooth = odontogram[fdi] || null;
            const tk = getToothTypeKey(fdi);
            const td = TOOTH_TYPES[tk];
            const tx = upperX[fdi];
            // دندان بالا: ریشه بالاست، تاج پایین
            const rootTop = UPPER_Y_BASE + 18;
            const rootBot = rootTop + td.rh;
            const crownTop = rootBot;
            const crownBot = crownTop + td.ch;
            drawTooth(svg, fdi, tooth, tx, td, rootTop, rootBot, crownTop, crownBot, true, odontogram);
        });

        // --- رسم دندان‌های پایین ---
        lowerFDI.forEach(fdi => {
            const tooth = odontogram[fdi] || null;
            const tk = getToothTypeKey(fdi);
            const td = TOOTH_TYPES[tk];
            const tx = lowerX[fdi];
            // دندان پایین: تاج بالاست، ریشه پایین
            const crownTop = LOWER_Y_BASE;
            const crownBot = crownTop + td.ch;
            const rootTop = crownBot;
            const rootBot = rootTop + td.rh;
            drawTooth(svg, fdi, tooth, tx, td, rootTop, rootBot, crownTop, crownBot, false, odontogram);
        });

        // انتخاب اولین دندان دارای عارضه
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
        const cw = td.cw;
        const halfGap = 1;
        const rootW = Math.max(cw * 0.28, 7);

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("data-fdi", fdi);
        g.setAttribute("cursor", inOdontogram ? "pointer" : "default");
        g.setAttribute("class", "tooth-svg-group");

        // ریشه (ها)
        if (td.roots === 1) {
            drawRoot(g, tx + (cw - rootW)/2, rootTop, rootW, rootBot - rootTop, colorBorder, colorAlpha, isUpper);
        } else if (td.roots === 2) {
            const r1x = tx + cw * 0.17;
            const r2x = tx + cw * 0.55;
            const rW2 = rootW * 0.82;
            drawRoot(g, r1x, rootTop, rW2, rootBot - rootTop, colorBorder, colorAlpha, isUpper);
            drawRoot(g, r2x, rootTop, rW2, rootBot - rootTop, colorBorder, colorAlpha, isUpper);
        } else { // 3 roots (molars)
            const r1x = tx + cw * 0.05;
            const r2x = tx + cw * 0.37;
            const r3x = tx + cw * 0.65;
            const rW3 = rootW * 0.72;
            drawRoot(g, r1x, rootTop, rW3, rootBot - rootTop, colorBorder, colorAlpha, isUpper);
            drawRoot(g, r2x, rootTop, rW3, rootBot - rootTop, colorBorder, colorAlpha, isUpper);
            drawRoot(g, r3x, rootTop, rW3, rootBot - rootTop, colorBorder, colorAlpha, isUpper);
        }

        // تاج دندان (Crown)
        const crown = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        crown.setAttribute("class", "tooth-crown");
        crown.setAttribute("x", tx + halfGap);
        crown.setAttribute("y", crownTop);
        crown.setAttribute("width", cw - halfGap*2);
        crown.setAttribute("height", crownBot - crownTop);
        crown.setAttribute("rx", isUpper ? "4" : "4");
        crown.setAttribute("fill", colorAlpha);
        crown.setAttribute("stroke", colorBorder);
        crown.setAttribute("stroke-width", inOdontogram ? "1.5" : "1");
        g.appendChild(crown);

        // شماره FDI روی تاج
        const numY = crownTop + (crownBot - crownTop) * 0.55;
        const numEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        numEl.setAttribute("x", tx + cw / 2);
        numEl.setAttribute("y", numY);
        numEl.setAttribute("text-anchor", "middle");
        numEl.setAttribute("dominant-baseline", "middle");
        numEl.setAttribute("font-size", cw > 28 ? "9.5" : "8.5");
        numEl.setAttribute("font-weight", "800");
        numEl.setAttribute("fill", inOdontogram ? (toothData.status === 'healthy' ? '#047857' : colorBorder) : "#94a3b8");
        numEl.setAttribute("font-family", "Arial, sans-serif");
        numEl.textContent = fdi;
        g.appendChild(numEl);

        // نشانگر وضعیت (نشانگر نقطه‌ای کوچک در گوشه تاج برای دندان‌های دارای عارضه)
        if (inOdontogram && toothData.status !== 'healthy') {
            const dotY = isUpper ? crownTop + 5 : crownBot - 5;
            const dotX = tx + cw - 5;
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", dotX);
            dot.setAttribute("cy", dotY);
            dot.setAttribute("r", "3.5");
            dot.setAttribute("fill", color);
            dot.setAttribute("stroke", "#ffffff");
            dot.setAttribute("stroke-width", "1");
            g.appendChild(dot);
        }

        // رویداد کلیک
        if (inOdontogram) {
            g.addEventListener("click", () => {
                highlightSVGTooth(g);
                selectTooth(toothData);
            });

            // Tooltip hover
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = `دندان #${fdi} — ${toothData.name}\nوضعیت: ${toothData.status_label}\nدرمان: ${toothData.treatment || 'چکاپ'}`;
            g.appendChild(title);
        }

        svg.appendChild(g);
    }

    function drawRoot(parent, rx, ry, rw, rh, colorBorder, colorFill, isUpper) {
        const root = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        root.setAttribute("class", "tooth-root");
        root.setAttribute("x", rx);
        root.setAttribute("y", ry);
        root.setAttribute("width", rw);
        root.setAttribute("height", rh);
        root.setAttribute("rx", "2");
        root.setAttribute("fill", colorFill);
        root.setAttribute("stroke", colorBorder);
        root.setAttribute("stroke-width", "0.8");
        root.setAttribute("opacity", "0.85");
        parent.appendChild(root);
    }

    function highlightSVGTooth(g) {
        document.querySelectorAll(".tooth-svg-group").forEach(el => {
            el.classList.remove("active-tooth");
            const c = el.querySelector(".tooth-crown");
            if (c) {
                c.setAttribute("stroke-width", "1.5");
            }
        });
        g.classList.add("active-tooth");
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

    function createToothNode(tooth) {
        // نگهداری برای سازگاری با کد قدیمی (در صورت نیاز)
        const node = document.createElement("div");
        node.className = "tooth-node";
        node.dataset.fdi = tooth.fdi;
        node.title = `${tooth.name} (${tooth.status_label})`;
        node.innerHTML = `<span class="tooth-fdi">#${tooth.fdi}</span><span class="tooth-status-dot" style="background: ${tooth.status_color};"></span>`;
        node.addEventListener("click", () => {
            document.querySelectorAll(".tooth-node").forEach(n => n.classList.remove("active"));
            node.classList.add("active");
            selectTooth(tooth);
        });
        return node;
    }

    function selectTooth(tooth) {
        const box = document.getElementById("selectedToothBox");
        box.style.display = "flex";

        const badge = document.getElementById("toothDetailBadge");
        badge.innerText = `#${tooth.fdi}`;
        badge.style.background = tooth.status_color || '#10b981';

        document.getElementById("toothDetailTitle").innerText = tooth.name;

        // نوع دندان (آسیا، پره‌مولر، نیش، پیشین)
        const typeEl = document.getElementById("toothDetailType");
        if (typeEl) typeEl.innerText = tooth.type || "";

        document.getElementById("toothDetailQuadrant").innerText = tooth.quadrant_fa || "فک";

        const statusPill = document.getElementById("toothDetailStatus");
        statusPill.innerText = tooth.status_label;
        const isHealthy = (tooth.status === 'healthy');
        statusPill.style.background = isHealthy ? '#d1fae5' : hexToRGBA(tooth.status_color || '#ef4444', 0.15);
        statusPill.style.color = isHealthy ? '#059669' : (tooth.status_color || '#dc2626');
        statusPill.style.border = `1px solid ${isHealthy ? '#6ee7b7' : (tooth.status_color || '#ef4444')}`;

        document.getElementById("toothDetailLocation").innerText = tooth.anatomical_location || "تاج و ریشه طبیعی";
        document.getElementById("toothDetailDesc").innerText = tooth.finding;
        document.getElementById("toothDetailTreatment").innerText = tooth.treatment || "چکاپ دوره‌ای ۶ ماهه";

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
                        ✨ هیچ ناهنجاری بالینی در رادیوگرافی مشاهده نشد؛ تمام دندان‌ها در وضعیت سالم و طبیعی قرار دارند.
                    </td>
                </tr>
            `;
            return;
        }

        findings.forEach(f => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <strong>#${f.fdi}</strong> - ${f.tooth_name}
                </td>
                <td>
                    <span style="color: ${f.color_hex}; font-weight: 800;">● ${f.pathology_short}</span>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${f.pathology_label}</div>
                </td>
                <td>
                    <strong style="color: var(--primary);">${f.anatomical_location}</strong>
                </td>
                <td>
                    <span class="prob-badge-success">${f.confidence_pct}%</span>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${f.reliability}</div>
                </td>
                <td>
                    <span class="prob-badge-error">${f.error_pct}%</span>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">عدم قطعیت آماری</div>
                </td>
                <td style="font-size: 0.82rem; color: var(--text-secondary);">
                    ${f.treatment}
                </td>
            `;

            tr.addEventListener("click", () => {
                const toothNode = document.querySelector(`.tooth-node[data-fdi="${f.fdi}"]`);
                if (toothNode) toothNode.click();
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
                item.innerHTML = `
                    <img src="${crop.image}" alt="${crop.label}">
                    <div class="crop-header">
                        <span class="crop-title">${crop.label}</span>
                        <div class="crop-probs">
                            <span class="prob-badge-success">${crop.confidence_pct}%</span>
                            <span class="prob-badge-error">${crop.error_pct}%</span>
                        </div>
                    </div>
                    <div class="crop-location">محل عارضه: ${crop.anatomical_location}</div>
                    <div class="crop-desc">${crop.description}</div>
                `;
                cropsGallery.appendChild(item);
            });
        } else {
            cropsCard.style.display = "none";
        }
    }

    function renderReport(data) {
        const reportContent = document.getElementById("reportContent");
        const now = new Date().toLocaleDateString('fa-IR');

        let findingsRows = "";
        if (data.detected_findings && data.detected_findings.length > 0) {
            findingsRows = data.detected_findings.map(f => `
                <tr>
                    <td><strong>#${f.fdi}</strong> (${f.tooth_name})</td>
                    <td><span style="color: ${f.color_hex}; font-weight: bold;">${f.pathology_short}</span></td>
                    <td><strong>${f.anatomical_location}</strong></td>
                    <td style="color: var(--success); font-weight: bold;">${f.confidence_pct}%</td>
                    <td style="color: var(--danger); font-weight: bold;">${f.error_pct}%</td>
                    <td>${f.treatment}</td>
                </tr>
            `).join("");
        } else {
            findingsRows = `<tr><td colspan="6" style="text-align: center; color: var(--success); font-weight: bold;">کلیه ۳۲ دندان دارای ساختار طبیعی رادیوگرافیک و بدون عارضه حاد هستند.</td></tr>`;
        }

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
                <strong>یادداشت بالینی:</strong> این گزارش توسط سامانه هوش مصنوعی DentalAI با مدل اختصاصی YOLOv8 آموزش‌دیده روی داده‌های معتبر رادیولوژی استخراج شده است. درصدهای احتمال درستی و حاشیه خطا بر اساس کالیبراسیون داده‌های بالینی محاسبه گردیده و به عنوان دستیار تشخیصی در اختیار دندانپزشک قرار می‌گیرد.
            </p>
        `;
    }
});
