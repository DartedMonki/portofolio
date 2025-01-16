# Portfolio Project

## Overview
A modern, SEO-optimized portfolio website built with Next.js 14, TypeScript, and Material UI. This project follows best practices for performance, accessibility, and code quality.

## Tech Stack
- **Framework**: Next.js 14.2.23 (Pages Router)
- **UI Library**: Material UI (MUI)
- **Language**: TypeScript
- **Styling**: Emotion (MUI's default styling solution)
- **Form Management**: Formik
- **Additional Libraries**:
  - `notistack`: Toast notifications
  - `swiper`: Touch slider
  - `dayjs`: Date manipulation
  - `clsx`: CSS class composition

## Prerequisites
- Node.js v20.18.0
- npm v10.8.2

## Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/DartedMonki/portofolio.git
cd portfolio
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run dev:debug` - Start development server with debugging enabled
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint and TypeScript type checking
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## Code Quality Tools

### ESLint Configuration
- Extended configurations:
  - Next.js core web vitals
  - TypeScript recommended
  - JSX accessibility
  - React recommended
  - Import rules
  - Prettier

### Prettier Configuration
- Semi colons: true
- Single quotes: true
- Tab width: 2
- Print width: 100
- Organized imports with custom grouping

### TypeScript
- Strict type checking enabled
- Path aliases configured
- Latest TypeScript features supported

## Performance Optimizations
- Server-side rendering (SSR) enabled
- Image optimization with Next.js Image component
- Code splitting and dynamic imports
- SEO optimizations
- Strict linting rules for better code quality

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see https://www.gnu.org/licenses/.

For the full license text, see the [LICENSE](LICENSE) file in the repository.

## Author
DartedMonki

## Acknowledgments
- Next.js team for the amazing framework
- Material-UI team for the comprehensive component library
- All contributors and maintainers of the dependencies used in this project