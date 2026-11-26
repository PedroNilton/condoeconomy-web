/**
 * Utilitários de segurança para validação e higienização no frontend.
 * Previne envio de payloads maliciosos, injeções de script (XSS), SQLi
 * e caracteres de controle/bytes nulos.
 */

// Regex estrito para formato de e-mail seguro (sem caracteres perigosos como < > ; ' " \0)
export const EMAIL_SECURITY_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Padrões de scripts maliciosos e injeções (sem flag /g para evitar estado mutável em RegExp.test)
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
  /<script/i,
  /javascript:/i,
  /vbscript:/i,
  /data:text\/html/i,
  /onload\s*=/i,
  /onerror\s*=/i,
  /onclick\s*=/i,
  /onmouseover\s*=/i,
  /onfocus\s*=/i,
  /srcdoc\s*=/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<svg[^>]*onload/i
];

const SQLI_PATTERNS = [
  /(--|#|\/\*|\*\/)/,
  /(\b(union(\s+all)?|select|drop|truncate|delete|insert|update|alter|exec)\b)/i,
  /('|\b(or|and)\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/i
];

// Caracteres de controle ASCII perigosos (0-31 e 127) e bytes nulos
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/**
 * Remove espaços em branco nas extremidades, caracteres de controle invisíveis e aplica truncamento opcional.
 */
export function sanitizarEntrada(texto: string, maxLength?: number): string {
  if (!texto) return '';
  const limpo = texto.replace(new RegExp(CONTROL_CHARS_REGEX, 'g'), '').trim();
  return typeof maxLength === 'number' && maxLength > 0 ? limpo.slice(0, maxLength) : limpo;
}

/**
 * Avalia se o input fornecido possui assinaturas conhecidas de injeção ou script.
 */
export function contemAmeacas(texto: string): boolean {
  if (!texto) return false;

  if (CONTROL_CHARS_REGEX.test(texto)) return true;

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(texto)) return true;
  }

  for (const pattern of SQLI_PATTERNS) {
    if (pattern.test(texto)) return true;
  }

  return false;
}
