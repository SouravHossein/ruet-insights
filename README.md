# RUET Student Intelligence Dashboard

A comprehensive dashboard for analyzing RUET (Rajshahi University of Engineering & Technology) student data with interactive maps, analytics, and verification features.

## Features

### 🌍 Multi-language Support
- **English** and **Bangla** language support
- Automatic language detection based on browser settings
- Persistent language preference storage
- Complete UI translation for all components

### 🌓 Theme Toggle
- **Light** and **Dark** mode support
- **System** theme detection (follows OS preference)
- Persistent theme preference storage
- Smooth theme transitions

### 📊 Analytics & Visualization
- Interactive Bangladesh district map
- Student distribution analytics
- Department-wise statistics
- Merit rank filtering
- Verification status tracking

### 🔐 Student Verification
- PDF upload for admission data
- Automated data extraction
- District verification system
- Supabase integration for data storage

### 🎨 Modern UI
- Built with React + TypeScript
- Tailwind CSS for styling
- Shadcn/ui components
- Responsive design
- Accessible interface

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/ui
- **Internationalization**: react-i18next
- **Theme**: next-themes
- **Maps**: Leaflet, React-Leaflet
- **Backend**: Supabase
- **Charts**: Recharts
- **Forms**: React Hook Form, Zod

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ruet-insights
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## Usage

### Language Selection
- Click the language selector in the header
- Choose between English and বাংলা
- Language preference is automatically saved

### Theme Toggle
- Click the theme toggle button in the header
- Choose Light, Dark, or System theme
- Theme preference is automatically saved

### Navigation
- **Map & Analytics**: View student distribution on interactive map
- **Dashboard**: Overview statistics and quick actions
- **Admin Panel**: Manage student data and verifications
- **About**: Project information

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui components
│   ├── theme-provider.tsx
│   ├── language-selector.tsx
│   └── theme-toggle.tsx
├── layouts/            # Page layouts
├── pages/              # Route components
├── lib/                # Utilities and configurations
│   └── i18n.ts         # Internationalization setup
├── data/               # Static data files
└── integrations/       # External service integrations
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add translations for new text
5. Test theme compatibility
6. Submit a pull request

## License

This project is licensed under the MIT License.
