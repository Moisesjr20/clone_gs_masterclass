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

// Validar email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validar telefone (mínimo 10 dígitos)
function isValidPhone(phone) {
  return phone.replace(/\D/g, '').length >= 10;
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
      email: document.querySelector('[name="email"]').value.trim(),
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
      const response = await fetch('api/apply/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Erro da API
        if (data.fields) {
          // Erros de validação do backend
          Object.entries(data.fields).forEach(([fieldName, message]) => {
            showFieldError(fieldName, message);
          });
        } else {
          // Erro geral
          alert(data.error || 'Erro ao submeter. Tente novamente.');
        }
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        form.classList.remove('form-submitting');
        return;
      }

      // Sucesso!
      if (data.redirect_to) {
        // Redirecionar para página de obrigado
        window.location.href = data.redirect_to;
      } else {
        // Fallback
        alert('Inscrição enviada com sucesso!');
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        form.classList.remove('form-submitting');
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
