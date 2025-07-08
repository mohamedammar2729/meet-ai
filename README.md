# Meet AI 🤖💬

A modern SaaS platform for AI-powered video meetings with intelligent agents, real-time chat, and automated summaries. Built with Next.js 15, TypeScript, and cutting-edge AI technologies.

[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![tRPC](https://img.shields.io/badge/tRPC-11.x-2596be?style=flat-square&logo=trpc)](https://trpc.io/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-c5f74f?style=flat-square)](https://orm.drizzle.team/)
[![Stream](https://img.shields.io/badge/Stream-Video%20%26%20Chat-005fff?style=flat-square)](https://getstream.io/)

## ✨ Features

### 🎯 Core Functionality

- **AI-Powered Meetings**: Create and manage video meetings with intelligent AI agents
- **Custom AI Agents**: Build personalized AI assistants with custom instructions
- **Real-time Video Calls**: High-quality video conferencing powered by Stream Video SDK
- **Live Chat Integration**: Seamless chat experience during meetings
- **Automated Transcription**: Real-time meeting transcription and recording
- **AI-Generated Summaries**: Intelligent meeting summaries using OpenAI

### 🔐 Authentication & Security

- **Secure Authentication**: Powered by Better Auth with multiple providers
- **User Management**: Complete user registration, login, and profile management
- **Session Handling**: Secure session management with token-based authentication

### 💳 Premium Features

- **Freemium Model**: 3 free meetings and agents for new users
- **Subscription Management**: Polar.sh integration for premium subscriptions
- **Usage Tracking**: Real-time tracking of user limits and usage

### 🎨 User Experience

- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Dark/Light Mode**: Complete theme support
- **Real-time Updates**: Live data synchronization across all components
- **Advanced Search & Filtering**: Powerful search capabilities for meetings and agents
- **Pagination**: Efficient data loading with advanced pagination

## 🚀 Tech Stack

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Radix UI
- **State Management**: TanStack Query + tRPC
- **Forms**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui + Custom components

### Backend

- **API**: tRPC with type-safe procedures
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **File Storage**: Cloud-based storage solutions
- **Background Jobs**: Inngest for async processing

### AI & Video

- **AI Services**: OpenAI GPT integration
- **Video SDK**: Stream Video for real-time communication
- **Chat SDK**: Stream Chat for messaging
- **Transcription**: Automated speech-to-text
- **Avatar Generation**: DiceBear for user avatars

### Infrastructure

- **Database**: Neon PostgreSQL
- **Payments**: Polar.sh for subscription management
- **Real-time**: WebSocket connections
- **Deployment**: Vercel-ready configuration

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── api/               # API routes & webhooks
│   └── call/              # Video call interface
├── components/            # Reusable UI components
│   └── ui/               # shadcn/ui components
├── db/                   # Database schema & configuration
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries & configurations
├── modules/              # Feature-based modules
│   ├── agents/           # AI agents management
│   ├── auth/             # Authentication features
│   ├── call/             # Video calling features
│   ├── dashboard/        # Dashboard components
│   ├── meetings/         # Meeting management
│   └── premium/          # Subscription features
├── trpc/                 # tRPC setup & routers
└── validations/          # Zod schemas
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm/npm/yarn package manager

### 1. Clone the Repository

```bash
git clone <repository-url>
cd meet-ai
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/meetai"

# Authentication
BETTER_AUTH_SECRET="your-auth-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stream SDK
NEXT_PUBLIC_STREAM_VIDEO_API_KEY="your-stream-video-api-key"
STREAM_VIDEO_SECRET_KEY="your-stream-video-secret"
NEXT_PUBLIC_STREAM_CHAT_API_KEY="your-stream-chat-api-key"
STREAM_CHAT_SECRET_KEY="your-stream-chat-secret"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Polar.sh (Payments)
POLAR_ACCESS_TOKEN="your-polar-access-token"

# Inngest (Background Jobs)
INNGEST_EVENT_KEY="your-inngest-event-key"
```

### 4. Database Setup

```bash
# Generate and run database migrations
npm run db:push

# Open Drizzle Studio (optional)
npm run db:studio
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📊 Database Schema

### Core Tables

- **users**: User accounts and profiles
- **sessions**: Authentication sessions
- **agents**: AI agent configurations
- **meetings**: Video meeting records
- **accounts**: OAuth provider accounts

### Key Relationships

- Users can create multiple agents and meetings
- Meetings are associated with specific agents
- Full audit trail with timestamps

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio

# Webhooks (Development)
npm run dev:webhook  # Start ngrok tunnel for webhooks
```

## 🏗️ Architecture Overview

### API Layer (tRPC)

- **Type-safe APIs**: End-to-end type safety
- **Middleware**: Authentication and premium checks
- **Procedures**: Organized by feature modules
- **Real-time**: WebSocket support for live features

### State Management

- **TanStack Query**: Server state management
- **tRPC Integration**: Automatic query invalidation
- **Optimistic Updates**: Instant UI feedback
- **Caching**: Intelligent data caching strategies

### Authentication Flow

1. User signs up/signs in via Better Auth
2. Session management with secure tokens
3. Protected routes with middleware
4. Role-based access control

### Meeting Workflow

1. User creates meeting with selected AI agent
2. Stream Video call initialization
3. Real-time transcription and recording
4. Background processing for AI summaries
5. Post-meeting analysis and storage

## 🔌 API Endpoints

### Agents

- `agents.create` - Create new AI agent
- `agents.getMany` - List user's agents (paginated)
- `agents.getOne` - Get specific agent details
- `agents.update` - Update agent configuration
- `agents.remove` - Delete agent

### Meetings

- `meetings.create` - Create new meeting
- `meetings.getMany` - List user's meetings (with filters)
- `meetings.getOne` - Get meeting details
- `meetings.update` - Update meeting info
- `meetings.remove` - Delete meeting
- `meetings.generateToken` - Generate Stream Video token
- `meetings.generateChatToken` - Generate Stream Chat token
- `meetings.getTranscript` - Get meeting transcript

### Premium

- `premium.getProducts` - List available plans
- `premium.getCurrentSubscription` - Get user's subscription
- `premium.getFreeUsage` - Get usage limits

## 🎨 UI Components

### Design System

- **Color Palette**: Modern, accessible color scheme
- **Typography**: Geist font family
- **Spacing**: Consistent spacing scale
- **Components**: Fully customizable with variants

### Key Components

- **DataTable**: Advanced table with sorting, filtering
- **CommandSelect**: Searchable dropdown with async loading
- **ResponsiveDialog**: Mobile-optimized dialogs
- **GeneratedAvatar**: AI-generated user avatars
- **LoadingState**: Consistent loading indicators

## 🔒 Security Features

- **Input Validation**: Zod schemas for all data
- **SQL Injection Prevention**: Drizzle ORM protection
- **Authentication Middleware**: Protected routes
- **Rate Limiting**: API endpoint protection
- **CORS Configuration**: Secure cross-origin requests

## 📈 Performance Optimizations

- **Server Components**: Reduced client-side JavaScript
- **Streaming**: Progressive page loading
- **Image Optimization**: Next.js Image component
- **Database Indexing**: Optimized queries
- **Caching**: Multiple caching layers

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on git push

### Self-Hosting

1. Build the application: `npm run build`
2. Start the server: `npm run start`
3. Configure reverse proxy (nginx/Apache)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages

## 📚 Learning Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM Guide](https://orm.drizzle.team/docs/overview)
- [Stream Video SDK](https://getstream.io/video/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Verify DATABASE_URL format
2. **Authentication**: Check OAuth provider configuration
3. **Stream SDK**: Ensure API keys are correctly set
4. **Build Errors**: Clear `.next` folder and rebuild

### Support

- Create an issue for bugs
- Check existing issues first
- Provide detailed error logs

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vercel](https://vercel.com) for hosting platform
- [Stream](https://getstream.io) for video/chat infrastructure
- [OpenAI](https://openai.com) for AI capabilities
- [shadcn/ui](https://ui.shadcn.com) for component library


