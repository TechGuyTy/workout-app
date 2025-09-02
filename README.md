# ⚔️ Workout Tracker

A modern, offline-first workout tracking application with a medieval theme, built with React, TypeScript, and IndexedDB.

## 🚀 Features

### Core Functionality
- **Today's Workout**: Quick add sets with last-used defaults, rest timer, and real-time tracking
- **Workout History**: View past workouts with detailed analytics and filtering
- **Exercise PRs**: Track personal records with 1RM calculations and progress charts
- **Workout Templates**: Create and use pre-defined workout routines
- **Settings & Data**: Export/import data, customize units, and manage preferences

### Technical Features
- **Offline-First**: Works completely offline using IndexedDB
- **PWA Ready**: Installable on mobile and desktop devices
- **Responsive Design**: Mobile-first design with touch-friendly interface
- **Real-time Updates**: Live data synchronization and progress tracking
- **Data Export/Import**: JSON backup and restore functionality

### Medieval Theme
- Custom color palette inspired by medieval aesthetics
- Cinzel font for headings and titles
- Medieval-inspired icons and visual elements
- Dark theme optimized for low-light environments

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Database**: IndexedDB via Dexie
- **Charts**: Recharts for progress visualization
- **PWA**: Workbox service worker
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

## 📱 PWA Features

- **Offline Support**: Full functionality without internet connection
- **Installable**: Add to home screen on mobile and desktop
- **Auto-updates**: Seamless app updates with user notification
- **Responsive**: Optimized for all device sizes

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd workout-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`
   
   **Note**: The dev server runs with `--host 0.0.0.0` for mobile testing on your local network.

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Type checking
npm run type-check
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## 🌐 GitHub Pages Deployment

### Automatic Deployment

1. **Push to main branch**: The GitHub Action will automatically build and deploy
2. **Repository settings**: Ensure GitHub Pages is enabled and set to deploy from Actions

### Manual Deployment

1. **Update base path** in `vite.config.ts`:
   ```typescript
   base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/'
   ```

2. **Build and deploy**:
   ```bash
   npm run build
   # Upload dist/ folder to GitHub Pages
   ```

### GitHub Action

The included GitHub Action automatically:
- Builds the app on push to main
- Deploys to GitHub Pages
- Handles base path configuration

## 📊 Database Schema

### Stores
- **workouts**: Workout sessions with date, notes, and duration
- **exercises**: Exercise definitions with muscle groups and preferences
- **sets**: Individual set records with weight, reps, and RPE
- **templates**: Pre-defined workout routines
- **settings**: App configuration and preferences

### Indexes
- Date-based workout queries
- Exercise performance tracking
- Timestamp-based set ordering

## 🎨 Customization

### Theme Colors
Custom medieval color palette in `tailwind.config.js`:
- `medieval-*`: Orange/brown medieval tones
- `parchment-*`: Light neutral colors

### Fonts
- **Cinzel**: Medieval serif for headings
- **Inter**: Modern sans-serif for body text

### Styling
- Component classes in `src/index.css`
- Responsive design with mobile-first approach
- Dark theme optimized for workout environments

## 📱 Mobile Experience

- **Touch-friendly**: Large tap targets and swipe gestures
- **Responsive**: Optimized for all screen sizes
- **Offline**: Full functionality without internet
- **PWA**: Installable on mobile devices

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Set to 'production' for GitHub Pages deployment

### Build Configuration
- **Base Path**: Automatically configured for GitHub Pages
- **PWA**: Service worker and manifest generation
- **Source Maps**: Enabled for debugging

## 🧪 Testing Strategy

- **Unit Tests**: Utility functions and database helpers
- **Integration Tests**: Database operations and state management
- **E2E Tests**: User workflows and interactions

## 📈 Performance

- **Lighthouse Score**: Optimized for PWA, performance, and accessibility
- **Bundle Size**: Tree-shaking and code splitting
- **Caching**: Service worker for offline assets
- **Database**: IndexedDB with optimized queries

## 🔒 Data Privacy

- **Local Storage**: All data stored locally on device
- **No Cloud**: No external data transmission
- **Export/Import**: User-controlled data backup
- **Offline**: No internet connection required

## 🚀 Future Enhancements

- **Social Features**: Share workouts and achievements
- **Advanced Analytics**: More detailed progress tracking
- **Exercise Library**: Built-in exercise instructions
- **Workout Plans**: Structured training programs
- **Cloud Sync**: Optional cloud backup (user choice)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Dexie**: IndexedDB wrapper for React
- **Recharts**: Chart library for progress visualization
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Modern build tool for React applications

---

**Built with ⚔️ medieval spirit and modern technology**
