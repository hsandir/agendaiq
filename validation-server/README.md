# Local Validation Server for Cursor

Bu validation server, Cursor'da API kotası harcamadan validation işlemleri yapmanızı sağlar.

## Kurulum

```bash
cd validation-server
npm install
npm start
```

Server `http://localhost:3456` adresinde çalışır.

## Cursor'da Kullanım

### 1. Form Validation

```typescript
import { validateForm, ValidationSchemas } from '@/lib/validation/client';

// Login form validation
const handleSubmit = async (formData) => {
  const { isValid, errors } = await validateForm(
    formData,
    ValidationSchemas.LOGIN_FORM
  );
  
  if (!isValid) {
    setFormErrors(errors);
    return;
  }
  
  // Form is valid, proceed with submission
};
```

### 2. Field Validation

```typescript
import { validateField, ValidationSchemas } from '@/lib/validation/client';

// Email field validation
const handleEmailChange = async (email) => {
  const { isValid, error } = await validateField(
    'email',
    email,
    ValidationSchemas.EMAIL
  );
  
  if (!isValid) {
    setEmailError(error);
  }
};
```

### 3. Custom Schema Ekleme

```typescript
import { addSchema, validate } from '@/lib/validation/client';

// Add custom schema
await addSchema('customForm', {
  type: 'object',
  properties: {
    title: { type: 'string', min: 3, max: 100 },
    priority: { type: 'enum', values: ['low', 'medium', 'high'] },
    dueDate: { type: 'string' }
  }
});

// Use custom schema
const result = await validate('customForm', formData);
```

### 4. React Component'de Kullanım

```tsx
import { useValidation, ValidationSchemas } from '@/lib/validation/client';

function MyForm() {
  const { isServerRunning, validateForm } = useValidation();
  const [errors, setErrors] = useState({});
  
  if (!isServerRunning) {
    return <div>Validation server is not running. Please start it first.</div>;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target));
    
    const { isValid, errors } = await validateForm(
      formData,
      ValidationSchemas.MEETING_FORM
    );
    
    if (!isValid) {
      setErrors(errors);
      return;
    }
    
    // Submit form
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {errors.title && <span>{errors.title}</span>}
    </form>
  );
}
```

## Mevcut Schemas

### Basic Types
- `email` - Email validation
- `phone` - Phone number validation
- `url` - URL validation
- `date` - DateTime validation

### Form Schemas
- `loginForm` - Login form (email, password)
- `meetingForm` - Meeting form (title, date, attendees, duration, type)
- `userProfile` - User profile (name, email, phone, role, department)

## Avantajlar

1. **Kota Harcamaz** - Tamamen local çalışır
2. **Hızlı** - Network gecikmesi yok
3. **Tutarlı** - Tüm projede aynı validation kuralları
4. **Type-safe** - Zod ile tip güvenliği
5. **Özelleştirilebilir** - Runtime'da yeni schema eklenebilir

## Cursor'da Kullanım Talimatı

Cursor'da validation kodu yazarken:

❌ **YAPMAYIN:**
```
"Write validation for this form"
"Add email validation"
"Create form validation logic"
```

✅ **YAPIN:**
```typescript
// Local validation server'ı kullanın
import { validate } from '@/lib/validation/client';
const result = await validate('email', userEmail);
```

Bu şekilde Cursor kotanızı korursunuz ve tutarlı validation mantığı elde edersiniz.