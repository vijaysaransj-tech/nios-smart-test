import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, LayoutDashboard, BookOpen, HelpCircle, Users, Settings, LogOut,
  Plus, Trash2, Edit, ChevronRight, FileText, ClipboardCheck
} from 'lucide-react';
import { 
  getSections, getQuestions, getCandidates, getTestAttempts, getTestSettings,
  addSection, deleteSection, addQuestion, deleteQuestion, addCandidate, deleteCandidate,
  updateTestSettings
} from '@/lib/store';
import { Section, Question, Candidate, TestAttempt } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Tab = 'overview' | 'sections' | 'questions' | 'candidates' | 'results' | 'settings';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [testEnabled, setTestEnabled] = useState(true);

  // Form states
  const [newSection, setNewSection] = useState({ name: '', description: '' });
  const [newCandidate, setNewCandidate] = useState({ fullName: '', email: '', phone: '' });
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState<{
    questionText: string; optionA: string; optionB: string; optionC: string; optionD: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D'; timeLimit: number;
  }>({
    questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
    correctAnswer: 'A', timeLimit: 30
  });

  useEffect(() => {
    // Check if admin is authenticated
    if (sessionStorage.getItem('adminAuthenticated') !== 'true') {
      navigate('/admin');
      return;
    }
    refreshData();
  }, [navigate]);

  const refreshData = () => {
    setSections(getSections());
    setQuestions(getQuestions());
    setCandidates(getCandidates());
    setAttempts(getTestAttempts());
    setTestEnabled(getTestSettings().isTestEnabled);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    navigate('/admin');
  };

  const handleAddSection = () => {
    if (!newSection.name.trim()) return;
    addSection({ name: newSection.name, description: newSection.description, displayOrder: sections.length + 1 });
    setNewSection({ name: '', description: '' });
    refreshData();
  };

  const handleDeleteSection = (id: string) => {
    if (confirm('Delete this section and all its questions?')) {
      deleteSection(id);
      refreshData();
    }
  };

  const handleAddCandidate = () => {
    if (!newCandidate.fullName.trim() || !newCandidate.email.trim() || !newCandidate.phone.trim()) return;
    addCandidate(newCandidate);
    setNewCandidate({ fullName: '', email: '', phone: '' });
    refreshData();
  };

  const handleDeleteCandidate = (id: string) => {
    if (confirm('Delete this candidate?')) {
      deleteCandidate(id);
      refreshData();
    }
  };

  const handleAddQuestion = () => {
    if (!selectedSection || !newQuestion.questionText.trim()) return;
    addQuestion({ ...newQuestion, sectionId: selectedSection });
    setNewQuestion({
      questionText: '', optionA: '', optionB: '', optionC: '', optionD: '',
      correctAnswer: 'A', timeLimit: 30
    });
    refreshData();
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Delete this question?')) {
      deleteQuestion(id);
      refreshData();
    }
  };

  const handleToggleTest = (enabled: boolean) => {
    updateTestSettings({ isTestEnabled: enabled });
    setTestEnabled(enabled);
  };

  const navItems = [
    { id: 'overview' as Tab, label: 'Overview', icon: LayoutDashboard },
    { id: 'sections' as Tab, label: 'Sections', icon: BookOpen },
    { id: 'questions' as Tab, label: 'Questions', icon: HelpCircle },
    { id: 'candidates' as Tab, label: 'Candidates', icon: Users },
    { id: 'results' as Tab, label: 'Results', icon: ClipboardCheck },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  const stats = [
    { label: 'Sections', value: sections.length, icon: BookOpen },
    { label: 'Questions', value: questions.length, icon: HelpCircle },
    { label: 'Candidates', value: candidates.length, icon: Users },
    { label: 'Attempts', value: attempts.length, icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-primary">ThinkerzHub</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {/* Overview */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-display font-bold text-foreground mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="bg-card rounded-xl p-6 shadow-soft border border-border"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Test Status */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Test Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {testEnabled ? 'Test is currently active' : 'Test is currently disabled'}
                  </p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  testEnabled ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                }`}>
                  {testEnabled ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sections */}
        {activeTab === 'sections' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-display font-bold text-foreground mb-6">Manage Sections</h1>
            
            {/* Add Section Form */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border mb-6">
              <h3 className="font-semibold text-foreground mb-4">Add New Section</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Section name"
                  value={newSection.name}
                  onChange={(e) => setNewSection(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newSection.description}
                  onChange={(e) => setNewSection(prev => ({ ...prev, description: e.target.value }))}
                />
                <Button onClick={handleAddSection}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </div>

            {/* Sections List */}
            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Questions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sections.map((section) => (
                    <tr key={section.id}>
                      <td className="px-6 py-4 font-medium text-foreground">{section.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{section.description || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {questions.filter(q => q.sectionId === section.id).length}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteSection(section.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Questions */}
        {activeTab === 'questions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-display font-bold text-foreground mb-6">Manage Questions</h1>
            
            {/* Add Question Form */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border mb-6">
              <h3 className="font-semibold text-foreground mb-4">Add New Question</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Section</Label>
                    <select
                      className="w-full mt-1 h-10 px-3 rounded-lg border border-input bg-background"
                      value={selectedSection || ''}
                      onChange={(e) => setSelectedSection(e.target.value)}
                    >
                      <option value="">Select a section</option>
                      {sections.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Time Limit (seconds)</Label>
                    <Input
                      type="number"
                      value={newQuestion.timeLimit}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 30 }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Question Text</Label>
                  <Input
                    placeholder="Enter the question"
                    value={newQuestion.questionText}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, questionText: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Option A" value={newQuestion.optionA} onChange={(e) => setNewQuestion(prev => ({ ...prev, optionA: e.target.value }))} />
                  <Input placeholder="Option B" value={newQuestion.optionB} onChange={(e) => setNewQuestion(prev => ({ ...prev, optionB: e.target.value }))} />
                  <Input placeholder="Option C" value={newQuestion.optionC} onChange={(e) => setNewQuestion(prev => ({ ...prev, optionC: e.target.value }))} />
                  <Input placeholder="Option D" value={newQuestion.optionD} onChange={(e) => setNewQuestion(prev => ({ ...prev, optionD: e.target.value }))} />
                </div>
                <div className="flex items-center gap-4">
                  <Label>Correct Answer:</Label>
                  {(['A', 'B', 'C', 'D'] as const).map(opt => (
                    <label key={opt} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={newQuestion.correctAnswer === opt}
                        onChange={() => setNewQuestion(prev => ({ ...prev, correctAnswer: opt }))}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                <Button onClick={handleAddQuestion} disabled={!selectedSection}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </div>

            {/* Questions List */}
            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {questions.map((q) => (
                    <tr key={q.id}>
                      <td className="px-6 py-4 text-foreground max-w-md truncate">{q.questionText}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {sections.find(s => s.id === q.sectionId)?.name}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{q.timeLimit}s</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(q.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Candidates */}
        {activeTab === 'candidates' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-display font-bold text-foreground mb-6">Manage Candidates</h1>
            
            {/* Add Candidate Form */}
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border mb-6">
              <h3 className="font-semibold text-foreground mb-4">Add New Candidate</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Full Name"
                  value={newCandidate.fullName}
                  onChange={(e) => setNewCandidate(prev => ({ ...prev, fullName: e.target.value }))}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate(prev => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  placeholder="Phone (10 digits)"
                  value={newCandidate.phone}
                  onChange={(e) => setNewCandidate(prev => ({ ...prev, phone: e.target.value }))}
                  maxLength={10}
                />
                <Button onClick={handleAddCandidate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Candidate
                </Button>
              </div>
            </div>

            {/* Candidates List */}
            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {candidates.map((c) => (
                    <tr key={c.id}>
                      <td className="px-6 py-4 font-medium text-foreground">{c.fullName}</td>
                      <td className="px-6 py-4 text-muted-foreground">{c.email}</td>
                      <td className="px-6 py-4 text-muted-foreground">{c.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          c.testStatus === 'ATTEMPTED' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-warning/10 text-warning'
                        }`}>
                          {c.testStatus === 'ATTEMPTED' ? 'Completed' : 'Not Attempted'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCandidate(c.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Results */}
        {activeTab === 'results' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-display font-bold text-foreground mb-6">Test Results</h1>
            
            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Candidate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Correct</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Incorrect</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attempts.map((a) => {
                    const candidate = candidates.find(c => c.id === a.candidateId);
                    return (
                      <tr key={a.id}>
                        <td className="px-6 py-4 font-medium text-foreground">{candidate?.fullName || 'Unknown'}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-primary">{a.totalScore}%</span>
                        </td>
                        <td className="px-6 py-4 text-success">{a.correctAnswers}</td>
                        <td className="px-6 py-4 text-destructive">{a.incorrectAnswers}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {a.completedAt ? new Date(a.completedAt).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {attempts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                        No test attempts yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-2xl font-display font-bold text-foreground mb-6">Test Settings</h1>
            
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Enable Admission Test</h3>
                  <p className="text-sm text-muted-foreground">
                    When disabled, candidates cannot access the test
                  </p>
                </div>
                <Switch
                  checked={testEnabled}
                  onCheckedChange={handleToggleTest}
                />
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
