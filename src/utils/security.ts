/**
 * Utilitários de segurança para validação e higienização no frontend.
 * Previne envio de payloads maliciosos, injeções de script (XSS), SQLi
 * e caracteres de controle/bytes nulos.
 */

// Regex estrito para formato de e-mail seguro (sem caracteres perigosos como < > ; ' " \0)
export const EMAIL_SECURITY_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Padrões de scripts maliciosos e injeções
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<svg[^>]*onload/gi
];

const SQLI_PATTERNS = [
  /(--|#|\/\*|\*\/)/g,
  /(\b(union(\s+all)?|select|drop|truncate|delete|insert|update|alter|exec)\b)/gi,
  /('|\b(or|and)\b\s+['"\d\w]+\s*=\s*['"\d\w]+)/gi
];

// Caracteres de controle ASCII perigosos (0-31 e 127) e bytes nulos
const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/**
 * Remove espaços em branco nas extremidades e caracteres de controle invisíveis.
 */
export function sanitizarEntrada(texto: string): string {
  if (!texto) return '';
  return texto.replace(CONTROL_CHARS_REGEX, '').trim();
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
