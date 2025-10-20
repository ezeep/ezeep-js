# ezeep.js Examples / Samples

This directory contains interactive examples for the ezeep.js component. Each example demonstrates a specific use case and can be tested directly in the browser.

We provide **two integration methods**:

1. **Direct Integration (01-04)**: Use the ezeep-js web component directly with your Client ID
2. **iframe Embed (05-08)**: Use the hosted service via iframe - **no Client ID needed!**

## 📋 Overview of Examples

### Direct Integration Examples (01-04)

### 1. Button Trigger Example (`01-button-trigger.html`)
Shows the simplest integration with a predefined print button.

**Features:**
- Standard ezeep print button
- Predefined file URL
- Minimal configuration
- Ready to use immediately

**Ideal for:** Quick integration, simple use cases

---

### 2. Custom Trigger Example (`02-custom-trigger.html`)
Demonstrates the use of custom HTML elements as triggers.

**Features:**
- Complete design control
- Multiple custom button styles
- Flexible event handlers
- Integration with existing UI frameworks

**Ideal for:** Custom designs, corporate branding, complex UIs

---

### 3. Drag & Drop File Trigger Example (`03-file-trigger.html`)
Shows the drag & drop functionality for file uploads.

**Features:**
- Interactive upload area
- Drag & drop support
- File selection by clicking
- Automatic print dialog after upload
- Customizable upload area size

**Ideal for:** Self-service terminals, document management, kiosk systems

---

### 4. Pre-Authentication Example (`04-pre-authentication.html`)
Shows pre-authentication with refresh token.

**Features:**
- Bypass OAuth login flow
- Seamless user experience
- Backend integration
- Token management

**Ideal for:** SSO integration, enterprise solutions, mobile apps

---

### iframe Embed Examples (05-08)

These examples use the **iframe embedding method** which offers:
- ✅ **No Client ID needed** - Configuration handled in hosted service
- ✅ **Works from any domain** - No OAuth registration required
- ✅ **No CORS issues** - Communication via postMessage
- ✅ **Simple integration** - Just include one script file
- ✅ **Automatic updates** - Hosted service updated independently

---

### 5. iframe Button Trigger Example (`05-iframe-button-trigger.html`)
Button trigger using iframe embedding method.

**Features:**
- No Client ID or Redirect URI configuration needed
- Print button in hosted iframe modal
- Works from any domain (HTTP or HTTPS)
- Simple JavaScript API

**Ideal for:** Third-party integrations, quick prototypes, portable solutions

**Comparison with Direct:** Same functionality as #1, but no OAuth setup needed!

---

### 6. iframe Custom Trigger Example (`06-iframe-custom-trigger.html`)
Custom buttons with iframe embedding.

**Features:**
- Custom styled buttons
- Full design control
- No OAuth complexity
- Event-driven API
- Multiple button examples

**Ideal for:** Custom UIs, branded experiences, framework integration

**Comparison with Direct:** Same as #2, but works without Client ID!

---

### 7. iframe File Upload Example (`07-iframe-file-trigger.html`)
File upload with iframe embedding.

**Features:**
- Standard HTML file input
- Automatic base64 conversion
- No file size limits from CORS
- Works from any domain
- Supports all file formats

**Ideal for:** Document management, ad-hoc printing, self-service kiosks

**Comparison with Direct:** Easier file handling without CORS restrictions!

---

### 8. iframe Pre-Authentication Example (`08-iframe-pre-authentication.html`)
Pre-authentication via iframe.

**Features:**
- Backend-managed tokens
- SSO integration
- No OAuth configuration
- Secure token transmission via postMessage
- Works from any domain

**Ideal for:** Enterprise SSO, backend auth systems, mobile apps

**Comparison with Direct:** Same as #4, plus works without OAuth registration!

---

## 🚀 Quick Start

### Choosing an Integration Method

**Use Direct Integration (01-04) when:**
- You have a registered Client ID
- You control the domain/redirect URI
- You want direct access to ezeep-js API
- Your app is served over HTTPS

**Use iframe Embed (05-08) when:**
- You don't want to manage OAuth configuration
- You need to integrate from multiple domains
- You want zero-configuration setup
- HTTP support is acceptable for testing

### Prerequisites for Direct Integration (01-04)

1. **ezeep Blue Account**
   - Sign up at: https://www.ezeep.com/free-trial/
   - You will receive administrator access to your ezeep organization

2. **Client-ID**
   - Contact the ezeep team at helpdesk@ezeep.com, for testing you could use the
     client-ID "78KYzeX5wS8r0FYz9KdvNt9xHMRA61PJK80IHwNj"
   - Provide your Redirect URI

3. **ezeep Blue Connector**
   - Download: https://ezeep.io/blueconnectorps
   - Install the Connector on a device with printer access
   - Authenticate with your ezeep account

4. **HTTPS Server**
   - Examples must be served over HTTPS
   - HTTP is not sufficient (OAuth requirement)

### Prerequisites for iframe Embed (05-08)

1. **ezeep Blue Account**
   - Sign up at: https://www.ezeep.com/free-trial/
   - You will receive administrator access to your ezeep organization

2. **ezeep Blue Connector**
   - Download: https://ezeep.io/blueconnectorps
   - Install the Connector on a device with printer access
   - Authenticate with your ezeep account

3. **No Client ID needed!**
   - iframe examples use a centralized hosted service
   - Client ID is configured in the hosted service
   - Works from any domain without registration

### Using the Examples

#### Direct Integration Examples (01-04)

1. **Adjust Configuration:**
   The examples are pre-configured with a test Client-ID for `https://localhost:3333/`.
   If you need to use your own Client-ID, update the following values:
   ```html
   <ezp-printing
     clientid="your-client-id"           <!-- Your Client-ID -->
     redirecturi="https://localhost:3333/" <!-- Your Redirect URI -->
     ...
   >
   ```

2. **Generate SSL Certificates:**

   Before starting the HTTPS server, you need to generate self-signed SSL certificates:

   ```bash
   # Navigate to the project root directory
   cd /path/to/ezeep-js

   # Generate self-signed certificate (valid for 10 years)
   openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out certificate.pem -batch
   ```

   This will create two files:
   - `certificate.pem` - SSL certificate
   - `key.pem` - Private key

   **Note:** These certificates are for development only. For production, use proper SSL certificates from a trusted Certificate Authority.

3. **Start HTTPS Server:**

   **Option A - With Node.js (http-server with SSL):**
   ```bash
   # Install http-server globally (if not already installed)
   npm install -g http-server

   # Start the server on port 3333
   http-server -S -C certificate.pem -K key.pem -p 3333
   ```

   **Note:** Port 3333 is used instead of the standard 8443 to avoid permission issues on some systems.

4. **Open in Browser:**

   Navigate to the samples directory and start the server from there:
   ```bash
   cd samples
   http-server -S -C ../certificate.pem -K ../key.pem -p 3333
   ```

   Then access:
   ```
   https://localhost:3333/
   ```

   Or access individual examples:
   - https://localhost:3333/01-button-trigger.html
   - https://localhost:3333/02-custom-trigger.html
   - https://localhost:3333/03-file-trigger.html
   - https://localhost:3333/04-pre-authentication.html

   **Browser Security Warning:** You'll see a security warning about the self-signed certificate. This is normal for local development:
   - Click "Advanced" or "Show Details"
   - Click "Proceed to localhost" or "Accept the Risk and Continue"

#### iframe Embed Examples (05-08)

The iframe embed examples are **much simpler** to run:

1. **Start a Simple HTTP Server:**

   You can use any HTTP server - HTTPS is NOT required for iframe examples!

   ```bash
   cd samples

   # Python 3
   python -m http.server 3333

   # Python 2
   python -m SimpleHTTPServer 3333

   # Node.js (http-server)
   npx http-server -p 3333

   # PHP
   php -S localhost:3333
   ```

2. **Open in Browser:**

   Just navigate to:
   ```
   http://localhost:3333/05-iframe-button-trigger.html
   http://localhost:3333/06-iframe-custom-trigger.html
   http://localhost:3333/07-iframe-file-trigger.html
   http://localhost:3333/08-iframe-pre-authentication.html
   ```

3. **How it Works:**
   - Examples load `ezeep-embed.js` client library
   - Client library creates an iframe pointing to hosted service
   - Hosted service (running at `http://localhost:3333/ezprinting`) handles OAuth
   - All communication happens via secure postMessage

4. **Important Notes:**
   - The **hosted service** (`ezprinting/index.html`) must also be served by your HTTP server
   - iframe examples reference `../ezprinting/ezeep-embed.js`
   - Update `hostUrl` in examples if your server runs on a different port
   - No SSL certificates needed for local testing!

5. **Test Interaction:**
   - Click on the print button
   - Authenticate with your ezeep account (first time only)
   - Select a printer
   - Adjust print settings
   - Print the document

---

## 🎨 Customization Options

### Theme Options
The component supports various color themes:
```html
theme="pink"      <!-- Pink -->
theme="red"       <!-- Red -->
theme="orange"    <!-- Orange -->
theme="green"     <!-- Green -->
theme="cyan"      <!-- Cyan -->
theme="blue"      <!-- Blue -->
theme="violet"    <!-- Violet -->
```

### Appearance Modes
```html
appearance="light"   <!-- Light mode -->
appearance="dark"    <!-- Dark mode -->
appearance="system"  <!-- System default -->
```

### Languages
```html
language="de"     <!-- German -->
language="en"     <!-- English -->
```

### Upload Area Size (only for trigger="file")
```css
:root {
  --ezp-upload-width: calc(80vw);
  --ezp-upload-height: calc(60vh);
}
```

---

## 🔧 Development and Debugging

### Using Browser Console
All examples include console logs for debugging:
```javascript
console.log('Component initialized')
console.log('Button clicked')
console.log('Pre-authentication successful')
```

Open browser developer tools (F12) to see these logs.

### Common Issues

**Problem: "Mixed Content" error**
- **Solution:** Ensure the page is served over HTTPS

**Problem: OAuth error during authentication**
- **Solution:** Verify that your Redirect URI is correctly registered

**Problem: No printers visible**
- **Solution:** Ensure the ezeep Blue Connector is running and has detected printers

**Problem: Pre-authentication fails**
- **Solution:** Verify that the refresh token is valid and not expired

---

## 📚 Additional Resources

- **ezeep Blue API Documentation:** https://apidocs.ezeep.com/
- **ezeep.js GitHub Repository:** https://github.com/ezeep/ezeep-js
- **ezeep Support:** helpdesk@ezeep.com
- **OAuth 2.0 Specification:** https://oauth.net/2/

---

## 🔒 Security Notes

1. **Never publish Client-ID or secrets in public code**
2. **Store refresh tokens securely on the backend**
3. **Always use HTTPS**
4. **Control printer access via permissions**

---

## 💡 Best Practices

### Performance
- Load the ezeep.js library only once per page
- Use the `module` and `nomodule` pattern for optimal browser compatibility
- Cache authenticated status to avoid unnecessary re-authentications

### User Experience
- Show clear error messages for authentication failures
- Implement loading states during the print process
- Provide feedback on upload progress (for file trigger)
- Save user printer preferences

### Code Organization
- Separate configuration from code
- Use environment variables for different environments (Dev, Staging, Production)
- Implement error handling and logging
- Document custom implementations

---

## 🛠️ Advanced Integration

### Angular
For Angular projects, there's a dedicated library:
```bash
npm install @ezeep/ngx-ezeep-js
```
More information: https://github.com/ezeep/ezeep-js/tree/ngx-ezeep-js

### React / Vue / Svelte
The web component can be used directly:
```jsx
// React example
function App() {
  const ezpRef = useRef(null);

  const handlePrint = async () => {
    await ezpRef.current.open();
  };

  return (
    <ezp-printing
      ref={ezpRef}
      clientid="your-client-id"
      redirecturi="https://your-site.com/"
      trigger="custom"
      fileurl="..."
    >
      <button onClick={handlePrint}>Print</button>
    </ezp-printing>
  );
}
```

---

## 📞 Support

For questions or problems:
- **Email:** helpdesk@ezeep.com
- **GitHub Issues:** https://github.com/ezeep/ezeep-js/issues
- **Documentation:** https://apidocs.ezeep.com/

---

## 📄 License

See the main project license in the root directory.

---

**Good luck testing the ezeep.js component!** 🎉
