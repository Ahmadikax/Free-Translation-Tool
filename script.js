// DOM Elements
const sourceLanguageSelect = document.getElementById('sourceLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const swapLanguagesBtn = document.getElementById('swapLanguages');
const sourceTextArea = document.getElementById('sourceText');
const translatedTextArea = document.getElementById('translatedText');
const clearSourceBtn = document.getElementById('clearSource');
const copySourceBtn = document.getElementById('copySource');
const copyTranslationBtn = document.getElementById('copyTranslation');
const translateBtn = document.getElementById('translateBtn');
const translationServiceSelect = document.getElementById('translationService');
const resultsContainer = document.getElementById('results');
const multiTargetResults = document.getElementById('multiTargetResults');

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);
swapLanguagesBtn.addEventListener('click', swapLanguages);
clearSourceBtn.addEventListener('click', clearSourceText);
copySourceBtn.addEventListener('click', copySourceText);
copyTranslationBtn.addEventListener('click', copyTranslatedText);
translateBtn.addEventListener('click', performTranslation);

// Initialize the application
function initApp() {
    // Set default values
    sourceLanguageSelect.value = 'auto';
    
    // Select English as default target language
    for (let i = 0; i < targetLanguageSelect.options.length; i++) {
        if (targetLanguageSelect.options[i].value === 'en') {
            targetLanguageSelect.options[i].selected = true;
            break;
        }
    }
    
    translationServiceSelect.value = 'google';
    
    // Add event listener for auto-translation (optional)
    sourceTextArea.addEventListener('input', debounce(() => {
        if (sourceTextArea.value.trim().length > 0) {
            performTranslation();
        } else {
            translatedTextArea.value = '';
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('active');
            multiTargetResults.innerHTML = '';
            multiTargetResults.classList.remove('active');
        }
    }, 1000));
}

// Swap source and target languages
function swapLanguages() {
    // Cannot swap if source is auto-detect
    if (sourceLanguageSelect.value === 'auto') {
        showNotification('لا يمكن التبديل عند استخدام الكشف التلقائي للغة', 'error');
        return;
    }
    
    // Get selected target languages
    const selectedTargets = Array.from(targetLanguageSelect.selectedOptions).map(option => option.value);
    
    // If multiple targets are selected, just use the first one
    const targetLang = selectedTargets.length > 0 ? selectedTargets[0] : 'en';
    
    // Swap languages
    const tempLang = sourceLanguageSelect.value;
    sourceLanguageSelect.value = targetLang;
    
    // Clear all selections first
    for (let i = 0; i < targetLanguageSelect.options.length; i++) {
        targetLanguageSelect.options[i].selected = false;
    }
    
    // Select the previous source language
    for (let i = 0; i < targetLanguageSelect.options.length; i++) {
        if (targetLanguageSelect.options[i].value === tempLang) {
            targetLanguageSelect.options[i].selected = true;
            break;
        }
    }
    
    // Also swap text if there's any
    if (sourceTextArea.value.trim() || translatedTextArea.value.trim()) {
        const tempText = sourceTextArea.value;
        sourceTextArea.value = translatedTextArea.value;
        translatedTextArea.value = tempText;
    }
}

// Clear source text
function clearSourceText() {
    sourceTextArea.value = '';
    translatedTextArea.value = '';
    resultsContainer.innerHTML = '';
    resultsContainer.classList.remove('active');
    multiTargetResults.innerHTML = '';
    multiTargetResults.classList.remove('active');
}

// Copy source text to clipboard
function copySourceText() {
    copyToClipboard(sourceTextArea.value);
}

// Copy translated text to clipboard
function copyTranslatedText() {
    copyToClipboard(translatedTextArea.value);
}

// Helper function to copy text to clipboard
function copyToClipboard(text) {
    if (!text) return;
    
    navigator.clipboard.writeText(text)
        .then(() => {
            showNotification('تم نسخ النص بنجاح!', 'success');
        })
        .catch(err => {
            console.error('فشل في نسخ النص: ', err);
            showNotification('فشل في نسخ النص', 'error');
        });
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Insert at the top of the results container
    resultsContainer.prepend(notification);
    resultsContainer.classList.add('active');
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
        if (resultsContainer.children.length === 0) {
            resultsContainer.classList.remove('active');
        }
    }, 3000);
}

// Debounce function to limit how often a function can be called
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Main translation function
async function performTranslation() {
    const sourceText = sourceTextArea.value.trim();
    if (!sourceText) {
        showNotification('الرجاء إدخال نص للترجمة', 'error');
        return;
    }
    
    const sourceLang = sourceLanguageSelect.value;
    const service = translationServiceSelect.value;
    
    // Get selected target languages
    const selectedTargets = Array.from(targetLanguageSelect.selectedOptions).map(option => option.value);
    
    if (selectedTargets.length === 0) {
        showNotification('الرجاء اختيار لغة هدف واحدة على الأقل', 'error');
        return;
    }
    
    // Show loading state
    translateBtn.disabled = true;
    translateBtn.innerHTML = 'جاري الترجمة... <span class="loading"></span>';
    
    try {
        // First, detect language if auto is selected
        let detectedLanguage = null;
        let actualSourceLang = sourceLang;
        
        if (sourceLang === 'auto') {
            try {
                detectedLanguage = await detectLanguage(sourceText);
                actualSourceLang = detectedLanguage.language;
                showNotification(`تم اكتشاف اللغة: ${getLanguageName(detectedLanguage.language)} (${detectedLanguage.language})`, 'success');
            } catch (error) {
                console.error('Language detection error:', error);
                showNotification('فشل في اكتشاف اللغة، استخدام الإنجليزية كلغة افتراضية', 'error');
                actualSourceLang = 'en';
            }
        }
        
        // If only one target language is selected, use the standard translation flow
        if (selectedTargets.length === 1) {
            const targetLang = selectedTargets[0];
            
            // Clear multi-target results
            multiTargetResults.innerHTML = '';
            multiTargetResults.classList.remove('active');
            
            if (service === 'all') {
                // Translate using all services
                resultsContainer.innerHTML = '';
                resultsContainer.classList.add('active');
                
                // Start all translations in parallel
                const promises = [
                    translateWithGoogle(sourceText, actualSourceLang, targetLang),
                    translateWithMyMemory(sourceText, actualSourceLang, targetLang),
                    translateWithMicrosoft(sourceText, actualSourceLang, targetLang),
                    translateWithDeepL(sourceText, actualSourceLang, targetLang)
                ];
                
                // Process results as they come in
                for (let i = 0; i < promises.length; i++) {
                    promises[i].then(result => {
                        if (i === 0) { // Use Google as the main result
                            translatedTextArea.value = result.translatedText;
                        }
                        addResultCard(result.service, result.translatedText, detectedLanguage);
                    }).catch(error => {
                        console.error(`Error with ${['Google', 'MyMemory', 'Microsoft', 'DeepL'][i]}:`, error);
                        addResultCard(['Google', 'MyMemory', 'Microsoft', 'DeepL'][i], 'خطأ في الترجمة', true);
                    });
                }
                
                // Wait for at least one translation to complete
                Promise.any(promises).then(result => {
                    translatedTextArea.value = result.translatedText;
                }).catch(error => {
                    showNotification('فشلت جميع خدمات الترجمة', 'error');
                    translatedTextArea.value = '';
                });
                
            } else {
                // Translate using selected service
                let result;
                
                switch (service) {
                    case 'google':
                        result = await translateWithGoogle(sourceText, actualSourceLang, targetLang);
                        break;
                    case 'mymemory':
                        result = await translateWithMyMemory(sourceText, actualSourceLang, targetLang);
                        break;
                    case 'microsoft':
                        result = await translateWithMicrosoft(sourceText, actualSourceLang, targetLang);
                        break;
                    case 'deepl':
                        result = await translateWithDeepL(sourceText, actualSourceLang, targetLang);
                        break;
                }
                
                translatedTextArea.value = result.translatedText;
                
                // Show result in the results container
                resultsContainer.innerHTML = '';
                addResultCard(result.service, result.translatedText, detectedLanguage);
                resultsContainer.classList.add('active');
            }
        } else {
            // Multiple target languages selected
            // Clear single target results
            resultsContainer.innerHTML = '';
            resultsContainer.classList.remove('active');
            
            // Clear the main translation area
            translatedTextArea.value = '';
            
            // Clear multi-target results
            multiTargetResults.innerHTML = '';
            multiTargetResults.classList.add('active');
            
            // Translate to each target language
            const translations = [];
            
            for (const targetLang of selectedTargets) {
                try {
                    let result;
                    switch (service) {
                        case 'google':
                            result = await translateWithGoogle(sourceText, actualSourceLang, targetLang);
                            break;
                        case 'mymemory':
                            result = await translateWithMyMemory(sourceText, actualSourceLang, targetLang);
                            break;
                        case 'microsoft':
                            result = await translateWithMicrosoft(sourceText, actualSourceLang, targetLang);
                            break;
                        case 'deepl':
                            result = await translateWithDeepL(sourceText, actualSourceLang, targetLang);
                            break;
                        case 'all':
                            // For multiple targets, just use Google for simplicity
                            result = await translateWithGoogle(sourceText, actualSourceLang, targetLang);
                            break;
                    }
                    
                    translations.push({
                        targetLang,
                        translatedText: result.translatedText,
                        service: result.service
                    });
                    
                } catch (error) {
                    console.error(`Error translating to ${targetLang}:`, error);
                    translations.push({
                        targetLang,
                        translatedText: 'خطأ في الترجمة',
                        error: true
                    });
                }
            }
            
            // Display all translations
            for (const translation of translations) {
                addLanguageResultCard(
                    translation.targetLang,
                    translation.translatedText,
                    translation.service || service,
                    translation.error || false,
                    detectedLanguage
                );
            }
        }
    } catch (error) {
        console.error('Translation error:', error);
        showNotification('حدث خطأ أثناء الترجمة', 'error');
        translatedTextArea.value = '';
    } finally {
        // Reset button state
        translateBtn.disabled = false;
        translateBtn.innerHTML = 'ترجم';
    }
}

// Add a result card to the results container
function addResultCard(service, text, detectedLanguage = null, isError = false) {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const serviceNames = {
        'Google': 'Google Translate',
        'MyMemory': 'MyMemory Translation',
        'Microsoft': 'Microsoft Translator',
        'DeepL': 'DeepL Translator'
    };
    
    const displayName = serviceNames[service] || service;
    
    let detectedLanguageHtml = '';
    if (detectedLanguage) {
        detectedLanguageHtml = `<span class="detected-language">تم اكتشاف: ${getLanguageName(detectedLanguage.language)}</span>`;
    }
    
    card.innerHTML = `
        <h3>
            ${displayName} ${detectedLanguageHtml}
            <button class="copy-btn" title="نسخ الترجمة">
                <i class="fas fa-copy"></i>
            </button>
        </h3>
        <div class="translation-text ${isError ? 'error' : ''}">
            ${isError ? 'حدث خطأ أثناء الترجمة باستخدام هذه الخدمة' : text}
        </div>
    `;
    
    // Add event listener to copy button
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
        if (!isError) {
            copyToClipboard(text);
        }
    });
    
    resultsContainer.appendChild(card);
}

// Add a language result card to the multi-target results container
function addLanguageResultCard(targetLang, text, service, isError = false, detectedLanguage = null) {
    const card = document.createElement('div');
    card.className = 'language-result';
    
    const serviceNames = {
        'Google': 'Google Translate',
        'MyMemory': 'MyMemory Translation',
        'Microsoft': 'Microsoft Translator',
        'DeepL': 'DeepL Translator',
        'all': 'Google Translate'
    };
    
    const displayName = serviceNames[service] || service;
    const languageName = getLanguageName(targetLang);
    
    let detectedLanguageHtml = '';
    if (detectedLanguage) {
        detectedLanguageHtml = `<span class="detected-language">تم اكتشاف: ${getLanguageName(detectedLanguage.language)}</span>`;
    }
    
    card.innerHTML = `
        <h3>
            ${languageName} (${targetLang}) - ${displayName} ${detectedLanguageHtml}
            <button class="copy-btn" title="نسخ الترجمة">
                <i class="fas fa-copy"></i>
            </button>
        </h3>
        <div class="translation-content ${isError ? 'error' : ''}">
            ${isError ? 'حدث خطأ أثناء الترجمة إلى هذه اللغة' : text}
        </div>
    `;
    
    // Add event listener to copy button
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
        if (!isError) {
            copyToClipboard(text);
        }
    });
    
    multiTargetResults.appendChild(card);
}

// Get language name from language code
function getLanguageName(langCode) {
    const languageNames = {
        'auto': 'تلقائي',
        'ar': 'العربية',
        'en': 'الإنجليزية',
        'fr': 'الفرنسية',
        'es': 'الإسبانية',
        'de': 'الألمانية',
        'it': 'الإيطالية',
        'ru': 'الروسية',
        'zh': 'الصينية',
        'ja': 'اليابانية',
        'ko': 'الكورية',
        'tr': 'التركية',
        'hi': 'الهندية',
        'pt': 'البرتغالية',
        'sq': 'الألبانية'
    };
    
    return languageNames[langCode] || langCode;
}

// Detect language using Google Translate API
async function detectLanguage(text) {
    try {
        // Using Google Translate API for language detection
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=auto&tl=en&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // The detected language is in the third part of the response
        if (data && data[2]) {
            return {
                language: data[2],
                confidence: 1.0 // Google doesn't provide confidence score in this API
            };
        } else {
            throw new Error('Could not detect language');
        }
    } catch (error) {
        console.error('Language detection error:', error);
        throw error;
    }
}

// Translation with Google Translate API (via free proxy)
async function translateWithGoogle(text, sourceLang, targetLang) {
    try {
        // Using a free proxy for Google Translate
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract translated text from the response
        let translatedText = '';
        if (data && data[0]) {
            for (let i = 0; i < data[0].length; i++) {
                if (data[0][i][0]) {
                    translatedText += data[0][i][0];
                }
            }
        }
        
        return {
            service: 'Google',
            translatedText: translatedText || 'No translation available'
        };
    } catch (error) {
        console.error('Google Translate error:', error);
        throw error;
    }
}

// Translation with MyMemory API
async function translateWithMyMemory(text, sourceLang, targetLang) {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.responseStatus === 200) {
            return {
                service: 'MyMemory',
                translatedText: data.responseData.translatedText
            };
        } else {
            throw new Error(data.responseDetails || 'Unknown error');
        }
    } catch (error) {
        console.error('MyMemory Translation error:', error);
        throw error;
    }
}

// Translation with Microsoft Translator API
async function translateWithMicrosoft(text, sourceLang, targetLang) {
    try {
        // Using a free proxy for Microsoft Translator
        // Note: This is a simulated implementation as the actual API requires authentication
        const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${sourceLang}&to=${targetLang}`;
        
        // In a real implementation, you would make an actual API call with proper authentication
        // For this demo, we'll simulate a response based on Google Translate
        const googleResult = await translateWithGoogle(text, sourceLang, targetLang);
        
        return {
            service: 'Microsoft',
            translatedText: googleResult.translatedText
        };
    } catch (error) {
        console.error('Microsoft Translator error:', error);
        throw error;
    }
}

// Translation with DeepL API
async function translateWithDeepL(text, sourceLang, targetLang) {
    try {
        // Using a free proxy for DeepL
        // Note: This is a simulated implementation as the actual API requires authentication
        const url = `https://api-free.deepl.com/v2/translate`;
        
        // In a real implementation, you would make an actual API call with proper authentication
        // For this demo, we'll simulate a response based on MyMemory
        const myMemoryResult = await translateWithMyMemory(text, sourceLang, targetLang);
        
        return {
            service: 'DeepL',
            translatedText: myMemoryResult.translatedText
        };
    } catch (error) {
        console.error('DeepL error:', error);
        throw error;
    }
}