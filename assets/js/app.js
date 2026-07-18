/**
 * Form handler — Grupo Escala e Performance / Webinar (aula ao vivo)
 * Captura UTMs, valida, e submete para /api/apply/
 */

const LANDING_PATH = '/webinar/';

// Capturar UTMs da URL
function getUTMParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || 'direto_site',
    utm_medium: params.get('utm_medium') || 'direto_site',
    utm_campaign: params.get('utm_campaign') || 'direto_site',
    utm_content: params.get('utm_content') || 'direto_site',
    utm_term: params.get('utm_term') || 'direto_site',
  };
}

// Remove espaços, pontos e vírgulas no fim do email (erro comum de digitação)
function sanitizeEmail(email) {
  return email.trim().replace(/[.,\s]+$/, '');
}

// Valida email: TLD deve conter apenas letras (sem pontos finais, sem caracteres inválidos)
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
}

// Validar telefone (mínimo 10 dígitos)
function isValidPhone(phone) {
  return phone.replace(/\D/g, '').length >= 10;
}

// Formata para E.164: ≤11 dígitos → Brasil (+55), caso contrário assume DDI já presente
function formatPhoneE164(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length <= 11 ? '+55' + digits : '+' + digits;
}

// Mostrar erro em campo específico
function showFieldError(fieldName, message) {
  const field = document.querySelector(`[name="${fieldName}"]`);
  if (field) {
    const group = field.closest('.form-group');
    if (group) {
      group.classList.add('error');
      const errorEl = group.querySelector('.error-message');
      if (errorEl) {
        errorEl.textContent = message;
      }
    }
  }
}

// Limpar erros de um campo
function clearFieldError(fieldName) {
  const field = document.querySelector(`[name="${fieldName}"]`);
  if (field) {
    const group = field.closest('.form-group');
    if (group) {
      group.classList.remove('error');
      const errorEl = group.querySelector('.error-message');
      if (errorEl) {
        errorEl.textContent = '';
      }
    }
  }
}

// Validar form client-side
function validateForm(formData) {
  const errors = {};

  if (!formData.nome || formData.nome.length < 2) {
    errors.nome = 'Nome inválido';
  }

  if (!isValidEmail(formData.email)) {
    errors.email = 'Email inválido';
  }

  if (!isValidPhone(formData.phone)) {
    errors.phone = 'WhatsApp inválido';
  }

  if (!formData.instagram || formData.instagram.length < 2) {
    errors.instagram = 'Informe seu Instagram';
  }

  if (!formData.faturamento_mensal) {
    errors.faturamento_mensal = 'Selecione uma faixa de faturamento';
  }

  return errors;
}

// Inicializar form
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('apply');
  if (!form) return;

  const fields = ['nome', 'email', 'phone', 'instagram', 'faturamento_mensal'];

  // Limpar erros ao digitar
  fields.forEach(fieldName => {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.addEventListener('blur', () => {
        clearFieldError(fieldName);
      });
    }
  });

  // Submissão do form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Coletar dados
    const formData = {
      nome: document.querySelector('[name="nome"]').value.trim(),
      email: sanitizeEmail(document.querySelector('[name="email"]').value),
      phone: document.querySelector('[name="phone"]').value.trim(),
      instagram: document.querySelector('[name="instagram"]').value.trim(),
      faturamento_mensal: document.querySelector('[name="faturamento_mensal"]').value.trim(),
    };

    // Validar
    const errors = validateForm(formData);

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([fieldName, message]) => {
        showFieldError(fieldName, message);
      });
      return;
    }

    // Limpar erros se passou na validação
    fields.forEach(fieldName => clearFieldError(fieldName));

    // Formatar telefone para E.164 antes de enviar
    formData.phone = formatPhoneE164(formData.phone);

    // Adicionar UTMs
    const utm = getUTMParams();
    const payload = {
      ...formData,
      ...utm,
      landing_path: LANDING_PATH,
      utm_page: LANDING_PATH,
      utm_funnel: 'webinar_fvp',
    };

    // Desabilitar submit
    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    form.classList.add('form-submitting');

    try {
      const response = await fetch('https://hook.georgesoares.com.br/webhook/webinar1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        alert('Erro ao submeter. Tente novamente.');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        form.classList.remove('form-submitting');
        return;
      }

      // Sucesso! Fechar modal do form e abrir modal de sucesso
      const formModal = document.getElementById('form-modal');
      if (formModal) formModal.hidden = true;
      document.body.classList.remove('modal-open');

      const successModal = document.getElementById('success-modal');
      if (successModal) {
        successModal.hidden = false;
        document.body.classList.add('modal-open');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      alert('Erro ao conectar. Tente novamente em alguns segundos.');
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      form.classList.remove('form-submitting');
    }
  });
});
