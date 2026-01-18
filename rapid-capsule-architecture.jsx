import React, { useState, useEffect } from 'react';
import { Activity, Users, Shield, Database, Cloud, Smartphone, Server, Cpu, Heart, Pill, Video, MessageCircle, CreditCard, Calendar, FileText, Lock, Zap, Globe, ChevronRight, ChevronDown, Layers, GitBranch, Box, ArrowRight, ArrowDown, CheckCircle, AlertCircle } from 'lucide-react';

const RapidCapsuleArchitecture = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [animationPhase, setAnimationPhase] = useState(0);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const sections = [
    { id: 'overview', label: 'System Overview', icon: Layers },
    { id: 'architecture', label: 'Architecture', icon: GitBranch },
    { id: 'ai', label: 'AI Services', icon: Cpu },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'flows', label: 'Data Flows', icon: Activity },
    { id: 'tech', label: 'Tech Stack', icon: Box },
  ];

  const DataFlowLine = ({ active, delay = 0 }) => (
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-700/50">
      <div 
        className={`absolute h-full w-8 rounded-full transition-all duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}
        style={{
          background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)',
          animation: active ? `flowPulse 1.5s ease-in-out infinite ${delay}s` : 'none',
        }}
      />
    </div>
  );

  const NodeCard = ({ icon: Icon, title, subtitle, color, children, glowing }) => (
    <div 
      className={`relative rounded-2xl border p-4 backdrop-blur-xl transition-all duration-500 hover:scale-105 ${
        glowing 
          ? `border-${color}-400/50 bg-gradient-to-br from-${color}-500/20 to-slate-900/90 shadow-lg shadow-${color}-500/20` 
          : 'border-slate-700/50 bg-slate-900/80 hover:border-slate-600/50'
      }`}
      style={glowing ? { boxShadow: `0 0 30px rgba(6, 182, 212, 0.15)` } : {}}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2.5 ${glowing ? 'bg-cyan-500/20' : 'bg-slate-800'}`}>
          <Icon className={`h-5 w-5 ${glowing ? 'text-cyan-400' : 'text-slate-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm">{title}</h4>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );

  const ConnectionLine = ({ direction = 'vertical', animated }) => (
    <div className={`flex items-center justify-center ${direction === 'vertical' ? 'h-8' : 'w-8 h-full'}`}>
      <div className={`relative ${direction === 'vertical' ? 'h-full w-0.5' : 'w-full h-0.5'} bg-slate-700 overflow-hidden`}>
        {animated && (
          <div 
            className="absolute bg-cyan-400 rounded-full"
            style={{
              width: direction === 'vertical' ? '100%' : '12px',
              height: direction === 'vertical' ? '12px' : '100%',
              animation: `${direction === 'vertical' ? 'flowDown' : 'flowRight'} 1.5s ease-in-out infinite`,
            }}
          />
        )}
      </div>
    </div>
  );

  const OverviewSection = () => (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-3">
          System Architecture Overview
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          AI-powered telemedicine platform serving patients, specialists, and healthcare administrators
        </p>
      </div>

      {/* User Layer */}
      <div className="grid grid-cols-4 gap-4 mb-2">
        {[
          { icon: Users, title: 'Patients', color: 'blue', desc: 'Health checkups & appointments' },
          { icon: Heart, title: 'Specialists', color: 'green', desc: 'Consultations & prescriptions' },
          { icon: Activity, title: 'Lifeguards', color: 'orange', desc: 'Emergency response' },
          { icon: Shield, title: 'Administrators', color: 'purple', desc: 'Platform management' },
        ].map((user, i) => (
          <div key={i} className="group">
            <div className={`rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-5 backdrop-blur-xl transition-all duration-300 hover:border-${user.color}-500/30 hover:shadow-lg hover:shadow-${user.color}-500/10`}>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${user.color}-500/20 to-transparent flex items-center justify-center mb-3`}>
                <user.icon className={`h-6 w-6 text-${user.color}-400`} />
              </div>
              <h3 className="font-semibold text-white mb-1">{user.title}</h3>
              <p className="text-xs text-slate-400">{user.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Connection arrows */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2">
          {[0,1,2,3].map(i => (
            <div key={i} className="flex flex-col items-center">
              <ArrowDown className={`h-5 w-5 text-cyan-500/60 ${animationPhase === i ? 'animate-bounce' : ''}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Frontend Layer */}
      <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-slate-900/90 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-3">
            <Smartphone className="h-8 w-8 text-blue-400" />
            <div>
              <h3 className="font-semibold text-white">Patient App</h3>
              <p className="text-xs text-slate-400">Vue.js 3 SPA • Port 3000</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {['PWA', 'Mobile-First', 'Offline'].map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-300">{tag}</span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-slate-900/90 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="h-8 w-8 text-purple-400" />
            <div>
              <h3 className="font-semibold text-white">Admin Portal</h3>
              <p className="text-xs text-slate-400">Vue.js 3 + Vuetify • Port 8080</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {['Dashboard', 'Analytics', 'Realtime'].map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-300">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* API Gateway */}
      <div className="flex justify-center">
        <ArrowDown className={`h-5 w-5 text-cyan-500/60 ${animationPhase === 1 ? 'animate-bounce' : ''}`} />
      </div>
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 via-slate-900/90 to-cyan-500/10 p-4 backdrop-blur-xl text-center">
          <div className="flex items-center justify-center gap-3">
            <Server className="h-6 w-6 text-cyan-400" />
            <div>
              <h3 className="font-semibold text-white">NGINX API Gateway</h3>
              <p className="text-xs text-slate-400">SSL Termination • Load Balancing • Route Management</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backend Services */}
      <div className="flex justify-center">
        <ArrowDown className={`h-5 w-5 text-cyan-500/60 ${animationPhase === 2 ? 'animate-bounce' : ''}`} />
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-slate-900/90 p-4 backdrop-blur-xl">
          <Cpu className="h-6 w-6 text-green-400 mb-2" />
          <h3 className="font-semibold text-white text-sm">Patient Backend</h3>
          <p className="text-xs text-slate-400">NestJS • Port 5020</p>
        </div>
        <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-slate-900/90 p-4 backdrop-blur-xl">
          <Cpu className="h-6 w-6 text-orange-400 mb-2" />
          <h3 className="font-semibold text-white text-sm">Admin Backend</h3>
          <p className="text-xs text-slate-400">NestJS • Port 5021</p>
        </div>
        <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-slate-900/90 p-4 backdrop-blur-xl">
          <Zap className="h-6 w-6 text-pink-400 mb-2" />
          <h3 className="font-semibold text-white text-sm">WebSocket</h3>
          <p className="text-xs text-slate-400">Socket.io • Realtime</p>
        </div>
      </div>

      {/* Data Layer */}
      <div className="flex justify-center">
        <ArrowDown className={`h-5 w-5 text-cyan-500/60 ${animationPhase === 3 ? 'animate-bounce' : ''}`} />
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-slate-900/90 p-4 backdrop-blur-xl text-center">
          <Database className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
          <h3 className="font-semibold text-white text-sm">MongoDB Atlas</h3>
          <p className="text-xs text-slate-400">Shared Database</p>
        </div>
        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-slate-900/90 p-4 backdrop-blur-xl text-center">
          <Cloud className="h-6 w-6 text-teal-400 mx-auto mb-2" />
          <h3 className="font-semibold text-white text-sm">AWS S3</h3>
          <p className="text-xs text-slate-400">File Storage</p>
        </div>
      </div>
    </div>
  );

  const ArchitectureSection = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
          Microservices Architecture
        </h2>
        <p className="text-slate-400">Scalable, modular backend with dedicated service layers</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Patient API */}
        <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-slate-900/95 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
            Patient API Service
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Auth Module', icon: Lock },
              { name: 'Health Checkup', icon: Heart },
              { name: 'Appointments', icon: Calendar },
              { name: 'Vitals', icon: Activity },
              { name: 'Prescriptions', icon: Pill },
              { name: 'Payments', icon: CreditCard },
              { name: 'WhatsApp', icon: MessageCircle },
              { name: 'Video Calls', icon: Video },
            ].map((mod, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <mod.icon className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-slate-300">{mod.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin API */}
        <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-slate-900/95 p-6 backdrop-blur-xl">
          <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-400 animate-pulse" />
            Admin API Service
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Admin Auth', icon: Shield },
              { name: 'Dashboard', icon: Layers },
              { name: 'Patient Mgmt', icon: Users },
              { name: 'Analytics', icon: Activity },
              { name: 'Claude AI', icon: Cpu },
              { name: 'Reports', icon: FileText },
            ].map((mod, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <mod.icon className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-slate-300">{mod.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Stores */}
      <div className="rounded-3xl border border-slate-700/30 bg-slate-900/50 p-6">
        <h3 className="text-lg font-bold text-slate-300 mb-4 text-center">Data Stores</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20">
            <Database className="h-10 w-10 text-yellow-400 mx-auto mb-2" />
            <h4 className="font-semibold text-white">MongoDB Atlas</h4>
            <p className="text-xs text-slate-400 mt-1">Primary Document Store</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20">
            <Zap className="h-10 w-10 text-red-400 mx-auto mb-2" />
            <h4 className="font-semibold text-white">Redis Cache</h4>
            <p className="text-xs text-slate-400 mt-1">Session & Cache Layer</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20">
            <Cloud className="h-10 w-10 text-orange-400 mx-auto mb-2" />
            <h4 className="font-semibold text-white">AWS S3</h4>
            <p className="text-xs text-slate-400 mt-1">File & Media Storage</p>
          </div>
        </div>
      </div>
    </div>
  );

  const AISection = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
          AI/ML Services Integration
        </h2>
        <p className="text-slate-400">Cutting-edge AI powering intelligent healthcare decisions</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Infermedica */}
        <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-slate-900/95 to-purple-500/10 p-6 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-500/30 flex items-center justify-center mb-4">
            <Heart className="h-7 w-7 text-violet-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Infermedica AI</h3>
          <p className="text-sm text-slate-400 mb-4">Symptom Analysis & Diagnosis Engine</p>
          <div className="space-y-2">
            {['NLP Symptom Parsing', 'Interview Engine', 'Triage Assessment', 'Condition Matching'].map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-violet-400" />
                <span className="text-xs text-slate-300">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Claude AI */}
        <div className="rounded-3xl border border-pink-500/30 bg-gradient-to-br from-pink-500/10 via-slate-900/95 to-rose-500/10 p-6 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/30 to-rose-500/30 flex items-center justify-center mb-4">
            <Cpu className="h-7 w-7 text-pink-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Claude AI</h3>
          <p className="text-sm text-slate-400 mb-4">LLM for Health Intelligence</p>
          <div className="space-y-2">
            {['Health Summaries', 'Document Analysis', 'Vision OCR', 'Patient Reports'].map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-pink-400" />
                <span className="text-xs text-slate-300">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AWS Textract */}
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900/95 to-orange-500/10 p-6 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">AWS Textract</h3>
          <p className="text-sm text-slate-400 mb-4">5-Level OCR Pipeline</p>
          <div className="space-y-2">
            {['Line Extraction', 'Block Analysis', 'Form Detection', 'Table Extraction', 'Key-Value Pairs'].map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-amber-400" />
                <span className="text-xs text-slate-300">{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health Score System */}
      <div className="rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 via-slate-900/95 to-teal-500/5 p-6">
        <h3 className="text-lg font-bold text-cyan-400 mb-6 text-center">6-Domain Health Score System</h3>
        <div className="grid grid-cols-6 gap-4">
          {[
            { name: 'Cardiovascular', weight: 20, color: 'red' },
            { name: 'Metabolic', weight: 20, color: 'orange' },
            { name: 'Mental', weight: 15, color: 'purple' },
            { name: 'Lifestyle', weight: 15, color: 'green' },
            { name: 'Physical', weight: 15, color: 'blue' },
            { name: 'Preventive', weight: 15, color: 'teal' },
          ].map((domain, i) => (
            <div key={i} className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full border-4 border-${domain.color}-500/30 bg-${domain.color}-500/10 flex items-center justify-center mb-2`}>
                <span className={`text-lg font-bold text-${domain.color}-400`}>{domain.weight}%</span>
              </div>
              <p className="text-xs text-slate-300">{domain.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SecuritySection = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-3">
          Security Architecture
        </h2>
        <p className="text-slate-400">Multi-layered defense protecting sensitive health data</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Security Layers */}
        {[
          { title: 'Client Security', color: 'blue', items: ['HTTPS/TLS 1.3', 'Content Security Policy', 'XSS Protection', 'CSRF Tokens'] },
          { title: 'Edge Security', color: 'purple', items: ['Cloudflare DDoS', 'Web App Firewall', 'Rate Limiting', 'Bot Protection'] },
          { title: 'API Security', color: 'green', items: ['JWT Authentication', 'Guard Chain', 'Role-Based Access', 'Session Mgmt'] },
          { title: 'Data Security', color: 'orange', items: ['Bcrypt Hashing', 'AES-256 Encryption', 'Input Sanitization', 'Audit Logging'] },
        ].map((layer, i) => (
          <div key={i} className={`rounded-2xl border border-${layer.color}-500/30 bg-gradient-to-br from-${layer.color}-500/10 to-slate-900/90 p-5`}>
            <h3 className={`font-bold text-${layer.color}-400 mb-4 text-center`}>{layer.title}</h3>
            <div className="space-y-2">
              {layer.items.map((item, j) => (
                <div key={j} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
                  <Shield className={`h-4 w-4 text-${layer.color}-400`} />
                  <span className="text-xs text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* RBAC */}
      <div className="rounded-3xl border border-slate-700/30 bg-slate-900/50 p-6">
        <h3 className="text-lg font-bold text-slate-300 mb-6 text-center">Role-Based Access Control (RBAC)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">Permission</th>
                <th className="py-3 px-4 text-blue-400">Patient</th>
                <th className="py-3 px-4 text-green-400">Specialist</th>
                <th className="py-3 px-4 text-orange-400">Lifeguard</th>
                <th className="py-3 px-4 text-purple-400">Admin</th>
              </tr>
            </thead>
            <tbody>
              {[
                { perm: 'View Own Data', p: true, s: true, l: true, a: true },
                { perm: 'View Patient Data', p: false, s: true, l: true, a: true },
                { perm: 'Create Prescriptions', p: false, s: true, l: false, a: true },
                { perm: 'Manage Users', p: false, s: false, l: false, a: true },
                { perm: 'View Analytics', p: false, s: false, l: false, a: true },
                { perm: 'System Config', p: false, s: false, l: false, a: true },
              ].map((row, i) => (
                <tr key={i} className="border-b border-slate-800">
                  <td className="py-3 px-4 text-slate-300">{row.perm}</td>
                  {['p', 's', 'l', 'a'].map(role => (
                    <td key={role} className="py-3 px-4 text-center">
                      {row[role] ? (
                        <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-700 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const FlowsSection = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-3">
          Key System Flows
        </h2>
        <p className="text-slate-400">Critical user journeys and data pipelines</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Health Checkup Flow */}
        <div className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-slate-900/95 p-6">
          <h3 className="text-lg font-bold text-teal-400 mb-4">🩺 AI Health Checkup Flow</h3>
          <div className="space-y-3">
            {[
              { step: '1', label: 'Patient describes symptoms', status: 'complete' },
              { step: '2', label: 'Infermedica NLP parsing', status: 'complete' },
              { step: '3', label: 'AI interview questions', status: 'active' },
              { step: '4', label: 'Diagnosis & triage', status: 'pending' },
              { step: '5', label: 'Claude health summary', status: 'pending' },
              { step: '6', label: 'Specialist recommendations', status: 'pending' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  item.status === 'complete' ? 'bg-teal-500 text-white' :
                  item.status === 'active' ? 'bg-teal-500/30 text-teal-400 ring-2 ring-teal-500 animate-pulse' :
                  'bg-slate-800 text-slate-500'
                }`}>
                  {item.step}
                </div>
                <span className={`text-sm ${item.status === 'pending' ? 'text-slate-500' : 'text-slate-300'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Prescription Flow */}
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-slate-900/95 p-6">
          <h3 className="text-lg font-bold text-amber-400 mb-4">💊 Prescription Processing</h3>
          <div className="space-y-3">
            {[
              { step: '1', label: 'Upload prescription image' },
              { step: '2', label: 'AWS Textract 5-level OCR' },
              { step: '3', label: 'Medication parsing & matching' },
              { step: '4', label: 'Stock & interaction check' },
              { step: '5', label: 'Payment processing' },
              { step: '6', label: 'Pharmacy fulfillment' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">
                  {item.step}
                </div>
                <span className="text-sm text-slate-300">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Flow */}
        <div className="rounded-3xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-slate-900/95 p-6">
          <h3 className="text-lg font-bold text-green-400 mb-4">💬 WhatsApp Integration</h3>
          <div className="flex flex-wrap gap-2">
            {['IDLE', 'VERIFICATION', 'MENU', 'PRESCRIPTION_UPLOAD', 'OCR_PROCESSING', 'ORDER_CREATION', 'PAYMENT_PENDING', 'PHARMACIST_CHAT'].map((state, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                {state}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">State machine architecture for conversational commerce</p>
        </div>

        {/* Appointment Flow */}
        <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-slate-900/95 p-6">
          <h3 className="text-lg font-bold text-blue-400 mb-4">📅 Multi-Channel Appointments</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Video, label: 'Video', desc: 'Zoom' },
              { icon: MessageCircle, label: 'Voice', desc: 'Twilio' },
              { icon: Activity, label: 'Chat', desc: 'In-App' },
              { icon: Users, label: 'In-Person', desc: 'Clinic' },
              { icon: Heart, label: 'Home', desc: 'Visit' },
              { icon: AlertCircle, label: 'Emergency', desc: 'Urgent' },
            ].map((channel, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-slate-800/50">
                <channel.icon className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-white font-medium">{channel.label}</p>
                <p className="text-xs text-slate-500">{channel.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const TechSection = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3">
          Technology Stack
        </h2>
        <p className="text-slate-400">Modern, scalable technologies powering the platform</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            title: 'Frontend',
            color: 'blue',
            items: ['Vue.js 3', 'Vuetify 3', 'Pinia', 'PWA', 'Composition API']
          },
          {
            title: 'Backend',
            color: 'green',
            items: ['NestJS 9', 'TypeScript', 'Mongoose', 'Passport.js', 'Socket.io']
          },
          {
            title: 'Database',
            color: 'yellow',
            items: ['MongoDB Atlas', 'Redis Cache', 'AWS S3', 'Document Store']
          },
          {
            title: 'Integrations',
            color: 'purple',
            items: ['Zoom API', 'Paystack', 'Twilio', 'Brevo', 'Gupshup']
          },
        ].map((stack, i) => (
          <div key={i} className={`rounded-2xl border border-${stack.color}-500/30 bg-gradient-to-br from-${stack.color}-500/10 to-slate-900/90 p-5`}>
            <h3 className={`font-bold text-${stack.color}-400 mb-4 text-center`}>{stack.title}</h3>
            <div className="space-y-2">
              {stack.items.map((item, j) => (
                <div key={j} className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
                  <div className={`w-2 h-2 rounded-full bg-${stack.color}-400`} />
                  <span className="text-xs text-slate-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Innovation Highlights */}
      <div className="rounded-3xl border border-gradient-to-r from-cyan-500/20 to-purple-500/20 bg-gradient-to-br from-cyan-500/5 via-slate-900/95 to-purple-500/5 p-6">
        <h3 className="text-xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          🏆 Innovation Highlights for Global Talent Visa
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { title: 'AI-Powered Diagnostics', desc: 'Infermedica integration for symptom analysis', impact: 'Democratizes medical AI' },
            { title: 'LLM Health Summaries', desc: 'Claude AI for patient-friendly explanations', impact: 'Improves health literacy' },
            { title: '6-Domain Health Scoring', desc: 'Digital health twin with weighted metrics', impact: 'Longitudinal tracking' },
            { title: 'WhatsApp Commerce', desc: 'Conversational pharmacy ordering', impact: 'Underserved market access' },
            { title: '5-Level OCR Pipeline', desc: 'AWS Textract prescription processing', impact: 'Digitizes handwritten Rx' },
            { title: 'Multi-Channel Telehealth', desc: '6 consultation types supported', impact: 'Flexible care delivery' },
          ].map((innovation, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <h4 className="font-semibold text-white text-sm mb-1">{innovation.title}</h4>
              <p className="text-xs text-slate-400 mb-2">{innovation.desc}</p>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-400" />
                <span className="text-xs text-yellow-400">{innovation.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-xl bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Rapid Capsule
                </h1>
                <p className="text-xs text-slate-400">AI-Powered Telemedicine Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                v2.0.0
              </span>
              <span className="px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                January 2026
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-56 flex-shrink-0">
            <div className="sticky top-8 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                    activeSection === section.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <section.icon className={`h-5 w-5 ${activeSection === section.id ? 'text-cyan-400' : ''}`} />
                  <span className="text-sm font-medium">{section.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="rounded-3xl border border-slate-800/50 bg-slate-900/30 backdrop-blur-xl p-8">
              {activeSection === 'overview' && <OverviewSection />}
              {activeSection === 'architecture' && <ArchitectureSection />}
              {activeSection === 'ai' && <AISection />}
              {activeSection === 'security' && <SecuritySection />}
              {activeSection === 'flows' && <FlowsSection />}
              {activeSection === 'tech' && <TechSection />}
            </div>
          </main>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes flowDown {
          0%, 100% { top: -12px; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes flowRight {
          0%, 100% { left: -12px; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes flowPulse {
          0% { left: -32px; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default RapidCapsuleArchitecture;
