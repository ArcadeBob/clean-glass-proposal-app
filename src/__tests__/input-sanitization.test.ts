import {
  INPUT_CONSTRAINTS,
  sanitizeAddress,
  sanitizeNotes,
  sanitizeNumber,
  sanitizePercentage,
  sanitizeProjectName,
  sanitizeText,
  sanitizeTextarea,
} from '../lib/input-sanitization';

describe('Input Sanitization Utilities', () => {
  describe('sanitizeText', () => {
    it('should sanitize normal text without issues', () => {
      const result = sanitizeText('Hello World');
      expect(result.sanitized).toBe('Hello World');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should prevent XSS attacks', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'onclick="alert(\'xss\')"',
        'eval("alert(\'xss\')")',
        'document.cookie',
        'window.location',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
        '<object data="javascript:alert(\'xss\')"></object>',
        '<embed src="javascript:alert(\'xss\')"></embed>',
        '<form action="javascript:alert(\'xss\')"></form>',
        '<input onfocus="alert(\'xss\')">',
        '<textarea onblur="alert(\'xss\')"></textarea>',
        '<select onchange="alert(\'xss\')"></select>',
        '<button onclick="alert(\'xss\')"></button>',
        '<link rel="stylesheet" href="javascript:alert(\'xss\')">',
        '<meta http-equiv="refresh" content="0;url=javascript:alert(\'xss\')">',
        "<style>body{background:url(javascript:alert('xss'))}</style>",
        'vbscript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        '&#x3c;script&#x3e;alert("xss")&#x3c;/script&#x3e;',
        '&#60;script&#62;alert("xss")&#60;/script&#62;',
      ];

      maliciousInputs.forEach(input => {
        const result = sanitizeText(input);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('potentially malicious content');
      });
    });

    it('should escape HTML entities when allowHtml is false', () => {
      const result = sanitizeText('<p>Hello & World</p>');
      expect(result.sanitized).toBe('&lt;p&gt;Hello &amp; World&lt;/p&gt;');
      expect(result.isValid).toBe(true);
    });

    it('should allow HTML when allowHtml is true', () => {
      const result = sanitizeText('<p>Hello World</p>', { allowHtml: true });
      expect(result.sanitized).toBe('<p>Hello World</p>');
      expect(result.isValid).toBe(true);
    });

    it('should handle newlines correctly', () => {
      const result = sanitizeText('Hello\nWorld\r\nTest');
      expect(result.sanitized).toBe('Hello World Test');
      expect(result.isValid).toBe(true);
    });

    it('should allow newlines when allowNewlines is true', () => {
      const result = sanitizeText('Hello\nWorld', { allowNewlines: true });
      expect(result.sanitized).toBe('Hello\nWorld');
      expect(result.isValid).toBe(true);
    });

    it('should validate length constraints', () => {
      const longText = 'a'.repeat(INPUT_CONSTRAINTS.TEXT.MAX_LENGTH + 1);
      const result = sanitizeText(longText);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('too long');
    });

    it('should validate minimum length', () => {
      const result = sanitizeText('', { minLength: 3 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('cannot be empty');
    });

    it('should handle empty input with minLength 0', () => {
      const result = sanitizeText('', { minLength: 0 });
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('');
    });
  });

  describe('sanitizeNumber', () => {
    it('should sanitize valid numbers', () => {
      const result = sanitizeNumber('123.45');
      expect(result.sanitized).toBe(123.45);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-numeric input', () => {
      const result = sanitizeNumber('abc');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('valid number');
    });

    it('should reject NaN and Infinity', () => {
      const result = sanitizeNumber('NaN');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('valid number');
    });

    it('should validate range constraints', () => {
      const result = sanitizeNumber('150', { min: 0, max: 100 });
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('at most 100');
    });

    it('should reject negative values when not allowed', () => {
      const result = sanitizeNumber('-10', { allowNegative: false });
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('at least 0');
    });

    it('should allow negative values when allowed', () => {
      const result = sanitizeNumber('-10', { allowNegative: true, min: -100 });
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(-10);
    });

    it('should round to reasonable precision', () => {
      const result = sanitizeNumber('123.456789');
      expect(result.sanitized).toBe(123.46);
    });
  });

  describe('sanitizeTextarea', () => {
    it('should sanitize normal textarea content', () => {
      const result = sanitizeTextarea('Hello\nWorld\nTest');
      expect(result.sanitized).toBe('Hello\nWorld\nTest');
      expect(result.isValid).toBe(true);
    });

    it('should prevent XSS in textarea content', () => {
      const result = sanitizeTextarea('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('potentially malicious content');
    });

    it('should handle URLs correctly', () => {
      const result = sanitizeTextarea('Check out https://example.com');
      expect(result.sanitized).toBe('Check out https://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should replace URLs when not allowed', () => {
      const result = sanitizeTextarea('Check out https://example.com', {
        allowUrls: false,
      });
      expect(result.sanitized).toBe('Check out [URL]');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('URLs are not allowed');
    });

    it('should validate length constraints', () => {
      const longText = 'a'.repeat(INPUT_CONSTRAINTS.TEXTAREA.MAX_LENGTH + 1);
      const result = sanitizeTextarea(longText);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('too long');
    });
  });

  describe('sanitizeProjectName', () => {
    it('should sanitize valid project names', () => {
      const result = sanitizeProjectName('My Glass Project');
      expect(result.sanitized).toBe('My Glass Project');
      expect(result.isValid).toBe(true);
    });

    it('should prevent XSS in project names', () => {
      const result = sanitizeProjectName('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('potentially malicious content');
    });

    it('should validate length constraints', () => {
      const longName = 'a'.repeat(
        INPUT_CONSTRAINTS.PROJECT_NAME.MAX_LENGTH + 1
      );
      const result = sanitizeProjectName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('too long');
    });

    it('should require minimum length', () => {
      const result = sanitizeProjectName('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('cannot be empty');
    });
  });

  describe('sanitizeAddress', () => {
    it('should sanitize valid addresses', () => {
      const result = sanitizeAddress('123 Main St, Los Angeles, CA 90001');
      expect(result.sanitized).toBe('123 Main St, Los Angeles, CA 90001');
      expect(result.isValid).toBe(true);
    });

    it('should prevent XSS in addresses', () => {
      const result = sanitizeAddress('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('potentially malicious content');
    });

    it('should validate length constraints', () => {
      const longAddress = 'a'.repeat(INPUT_CONSTRAINTS.ADDRESS.MAX_LENGTH + 1);
      const result = sanitizeAddress(longAddress);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('too long');
    });

    it('should require minimum length', () => {
      const result = sanitizeAddress('123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('too short');
    });
  });

  describe('sanitizeNotes', () => {
    it('should sanitize valid notes', () => {
      const result = sanitizeNotes('Project notes with\nmultiple lines');
      expect(result.sanitized).toBe('Project notes with\nmultiple lines');
      expect(result.isValid).toBe(true);
    });

    it('should prevent XSS in notes', () => {
      const result = sanitizeNotes('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('potentially malicious content');
    });

    it('should allow URLs in notes', () => {
      const result = sanitizeNotes('Check https://example.com for details');
      expect(result.sanitized).toBe('Check https://example.com for details');
      expect(result.isValid).toBe(true);
    });

    it('should validate length constraints', () => {
      const longNotes = 'a'.repeat(INPUT_CONSTRAINTS.NOTES.MAX_LENGTH + 1);
      const result = sanitizeNotes(longNotes);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('too long');
    });
  });

  describe('sanitizePercentage', () => {
    it('should sanitize valid percentages', () => {
      const result = sanitizePercentage('25.5');
      expect(result.sanitized).toBe(25.5);
      expect(result.isValid).toBe(true);
    });

    it('should reject values outside 0-100 range', () => {
      const result = sanitizePercentage('150');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('at most 100');
    });

    it('should reject negative values', () => {
      const result = sanitizePercentage('-10');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('at least 0');
    });

    it('should handle edge cases', () => {
      expect(sanitizePercentage('0').isValid).toBe(true);
      expect(sanitizePercentage('100').isValid).toBe(true);
      expect(sanitizePercentage('50.5').isValid).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(sanitizeText('').isValid).toBe(false);
      expect(sanitizeNumber('').isValid).toBe(false);
      expect(sanitizeTextarea('').isValid).toBe(true);
    });

    it('should handle whitespace correctly', () => {
      const result = sanitizeText('   Hello World   ');
      expect(result.sanitized).toBe('Hello World');
      expect(result.isValid).toBe(true);
    });

    it('should handle special characters', () => {
      const result = sanitizeText('Hello & World < 100 > 50');
      expect(result.sanitized).toBe('Hello &amp; World &lt; 100 &gt; 50');
      expect(result.isValid).toBe(true);
    });

    it('should handle unicode characters', () => {
      const result = sanitizeText('Hello 世界');
      expect(result.sanitized).toBe('Hello 世界');
      expect(result.isValid).toBe(true);
    });
  });
});
