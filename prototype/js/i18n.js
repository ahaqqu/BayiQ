const I18n = {
  get lang() {
    return localStorage.getItem('bq_lang') || 'id';
  },
  set(lang) {
    localStorage.setItem('bq_lang', lang);
    this.applyStatic();
  },
  toggle() {
    this.set(this.lang === 'id' ? 'en' : 'id');
  },
  t(key) {
    return (I18N[this.lang] && I18N[this.lang][key]) || I18N.id[key] || key;
  },
  L(obj) {
    return obj[this.lang] || obj.id;
  },
  applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = this.t(el.dataset.i18nPlaceholder);
    });
    document.documentElement.lang = this.lang;
  },
};

function t(key) { return I18n.t(key); }
function L(obj) { return I18n.L(obj); }
