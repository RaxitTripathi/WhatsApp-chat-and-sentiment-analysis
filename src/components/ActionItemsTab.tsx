import React, { useState, useMemo } from 'react';
import {
  ActionItem,
  ActionItemUrgency,
  ActionItemCategory,
  TaskTimelineCategory
} from '../types';
import {
  CheckSquare,
  Square,
  Clock,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Calendar,
  Sparkles,
  User,
  History,
  CalendarDays,
  ListTodo,
  CheckCircle2
} from 'lucide-react';
import { downloadAsCsv } from '../lib/exportCsv';

interface ActionItemsTabProps {
  actionItems: ActionItem[];
  onToggleComplete: (id: string) => void;
  onGeneratePdf: () => void;
  allUsers: string[];
}

export const ActionItemsTab: React.FC<ActionItemsTabProps> = ({
  actionItems,
  onToggleComplete,
  onGeneratePdf,
  allUsers
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [timelineFilter, setTimelineFilter] = useState<'All' | 'Pending' | 'Upcoming' | 'Past' | 'Completed'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Dynamic counts
  const totalCount = actionItems.length;
  const completedCount = actionItems.filter(i => i.isCompleted).length;
  const pendingCount = actionItems.filter(i => i.timelineCategory === 'pending' && !i.isCompleted).length;
  const upcomingCount = actionItems.filter(i => i.timelineCategory === 'upcoming' && !i.isCompleted).length;
  const pastCount = actionItems.filter(i => i.timelineCategory === 'past').length;

  // Filter items
  const filteredItems = useMemo(() => {
    return actionItems.filter(item => {
      // Participant filter
      if (userFilter !== 'All' && item.speaker !== userFilter && item.assignee !== userFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }
      // Timeline filter
      if (timelineFilter === 'Pending') {
        if (item.timelineCategory !== 'pending' || item.isCompleted) return false;
      } else if (timelineFilter === 'Upcoming') {
        if (item.timelineCategory !== 'upcoming' || item.isCompleted) return false;
      } else if (timelineFilter === 'Past') {
        if (item.timelineCategory !== 'past') return false;
      } else if (timelineFilter === 'Completed') {
        if (!item.isCompleted) return false;
      }

      // Keyword search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          item.taskText.toLowerCase().includes(q) ||
          item.speaker.toLowerCase().includes(q) ||
          (item.detectedDeadline && item.detectedDeadline.toLowerCase().includes(q)) ||
          (item.deadlineDateStr && item.deadlineDateStr.toLowerCase().includes(q)) ||
          item.category.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [actionItems, userFilter, categoryFilter, timelineFilter, searchTerm]);

  // Grouped items when viewing 'All'
  const pendingItems = useMemo(
    () => filteredItems.filter(i => i.timelineCategory === 'pending' && !i.isCompleted),
    [filteredItems]
  );
  const upcomingItems = useMemo(
    () => filteredItems.filter(i => i.timelineCategory === 'upcoming' && !i.isCompleted),
    [filteredItems]
  );
  const pastItems = useMemo(
    () => filteredItems.filter(i => i.timelineCategory === 'past'),
    [filteredItems]
  );

  const handleCopySingle = (item: ActionItem) => {
    const statusLabel = item.isCompleted
      ? 'Completed'
      : item.timelineCategory === 'upcoming'
      ? 'Upcoming'
      : item.timelineCategory === 'past'
      ? 'Past Deadline'
      : 'Pending';

    const text = `[${item.isCompleted ? 'x' : ' '}] ${item.taskText} (${statusLabel} | Owner: ${item.speaker}${
      item.detectedDeadline ? `, Deadline: ${item.detectedDeadline}` : ''
    }${item.deadlineDateStr ? ` [${item.deadlineDateStr}]` : ''})`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllOpen = () => {
    const openTasks = actionItems
      .filter(i => !i.isCompleted)
      .map(
        (i, idx) =>
          `${idx + 1}. [${i.timelineCategory.toUpperCase()}] ${i.taskText} — ${i.speaker}${
            i.detectedDeadline ? ` (Deadline: ${i.detectedDeadline})` : ''
          }`
      )
      .join('\n');

    navigator.clipboard.writeText(openTasks || 'No open action items.');
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportCsv = () => {
    const data = filteredItems.map(i => ({
      speaker: i.speaker,
      assignee: i.assignee,
      task: i.taskText,
      deadline: i.detectedDeadline || 'None detected',
      deadlineDate: i.deadlineDateStr || 'N/A',
      timelineClassification:
        i.timelineCategory === 'upcoming'
          ? 'Upcoming'
          : i.timelineCategory === 'past'
          ? 'Past'
          : 'Pending',
      status: i.isCompleted ? 'Completed' : 'Pending',
      urgency: i.urgency,
      category: i.category,
      messageDate: i.dateStr,
      confidence: `${i.confidence}%`
    }));
    downloadAsCsv(data, 'extracted_action_items.csv');
  };

  const getUrgencyBadge = (item: ActionItem) => {
    // For past tasks: "Do not mark it as urgent. Do not use rush/overdue language"
    if (item.timelineCategory === 'past' && !item.isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          <History className="w-3 h-3 text-slate-400" />
          Past Deadline
        </span>
      );
    }

    if (item.urgency === 'High' && !item.isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60">
          <AlertTriangle className="w-3 h-3" />
          High
        </span>
      );
    } else if (item.urgency === 'Medium' && !item.isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60">
          <Clock className="w-3 h-3" />
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
        Low
      </span>
    );
  };

  const getTimelineBadge = (item: ActionItem) => {
    if (item.isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Completed
        </span>
      );
    }

    switch (item.timelineCategory) {
      case 'upcoming':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <CalendarDays className="w-3 h-3 text-blue-500" />
            Upcoming Task
          </span>
        );
      case 'past':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <History className="w-3 h-3 text-slate-400" />
            Past
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <ListTodo className="w-3 h-3 text-amber-500" />
            Pending / Active
          </span>
        );
    }
  };

  const getCategoryBadge = (cat: ActionItemCategory) => {
    const map: Record<ActionItemCategory, string> = {
      Deliverable: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      Meeting: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      Review: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
      Resource: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      Task: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${map[cat]}`}>
        {cat}
      </span>
    );
  };

  const renderTaskCard = (item: ActionItem) => (
    <div
      key={item.id}
      className={`p-4 rounded-xl border transition-all duration-150 ${
        item.isCompleted
          ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-850 opacity-75'
          : item.timelineCategory === 'past'
          ? 'bg-slate-50/40 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 hover:border-slate-300'
          : item.timelineCategory === 'upcoming'
          ? 'bg-white dark:bg-slate-900 border-blue-200/60 dark:border-blue-900/40 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(item.id)}
          className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
          aria-label={item.isCompleted ? 'Mark as pending' : 'Mark as completed'}
        >
          {item.isCompleted ? (
            <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Square className="w-5 h-5 text-slate-400 dark:text-slate-600" />
          )}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {item.speaker}
              </span>
              {item.assignee !== item.speaker && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  &rarr; {item.assignee}
                </span>
              )}
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                ({item.dateStr} at {item.timeStr})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {getTimelineBadge(item)}
              {getUrgencyBadge(item)}
              {getCategoryBadge(item.category)}
            </div>
          </div>

          <p
            className={`text-sm font-medium leading-relaxed break-words ${
              item.isCompleted
                ? 'line-through text-slate-400 dark:text-slate-500'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {item.taskText}
          </p>

          {/* Deadline & Heuristics Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
            <div className="flex items-center flex-wrap gap-2">
              {item.detectedDeadline ? (
                <span
                  className={`inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded text-[11px] border ${
                    item.timelineCategory === 'upcoming'
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : item.timelineCategory === 'past'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>
                    Deadline: <strong>{item.detectedDeadline}</strong>
                    {item.deadlineDateStr && ` (${item.deadlineDateStr})`}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                  <Clock className="w-3 h-3" />
                  Active / Ongoing Task
                </span>
              )}

              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                Pattern: {item.triggerPhrase}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopySingle(item)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                title="Copy task"
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header & Feature Intro Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Action Items & Task Commitments
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                Date & Deadline Parser
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Compares extracted deadlines against the current date to categorize commitments into <strong>Pending</strong>, <strong>Upcoming</strong>, and <strong>Past</strong> deadlines.
            </p>
          </div>

          {/* Action Buttons: PDF & Export */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onGeneratePdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Generate a multi-page PDF summary for examiners"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate PDF Report</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Export filtered items to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleCopyAllOpen}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Copy all open tasks to clipboard"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedAll ? 'Copied Tasks!' : 'Copy Open Tasks'}</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards for Dynamic Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Pending Tasks Card */}
          <div
            onClick={() => setTimelineFilter('Pending')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              timelineFilter === 'Pending'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Pending Tasks</span>
              <ListTodo className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{pendingCount}</p>
            <span className="text-[10px] text-slate-400">Current active / Due today</span>
          </div>

          {/* Upcoming Tasks Card */}
          <div
            onClick={() => setTimelineFilter('Upcoming')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              timelineFilter === 'Upcoming'
                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-blue-700 dark:text-blue-400">Upcoming Tasks</span>
              <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{upcomingCount}</p>
            <span className="text-[10px] text-slate-400">Future scheduled deadlines</span>
          </div>

          {/* Past Deadlines Card */}
          <div
            onClick={() => setTimelineFilter('Past')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              timelineFilter === 'Past'
                ? 'bg-slate-200/80 dark:bg-slate-800 border-slate-400 dark:border-slate-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Past Tasks</span>
              <History className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">{pastCount}</p>
            <span className="text-[10px] text-slate-400">Previous / Passed deadlines</span>
          </div>

          {/* Completed Card */}
          <div
            onClick={() => setTimelineFilter('Completed')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              timelineFilter === 'Completed'
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{completedCount}</p>
            <span className="text-[10px] text-slate-400">Finished commitments</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search input */}
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search tasks, dates (e.g. '25 September', '10 October')..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Participant filter */}
          <div>
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="All">All Participants</option>
              {allUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="All">All Categories</option>
              <option value="Deliverable">Deliverables</option>
              <option value="Meeting">Meetings</option>
              <option value="Review">Reviews</option>
              <option value="Resource">Resources</option>
              <option value="Task">General Tasks</option>
            </select>
          </div>

          {/* Timeline filter */}
          <div>
            <select
              value={timelineFilter}
              onChange={e => setTimelineFilter(e.target.value as any)}
              className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
            >
              <option value="All">All Deadlines</option>
              <option value="Pending">Pending Tasks (Active / Today)</option>
              <option value="Upcoming">Upcoming Tasks (Future)</option>
              <option value="Past">Past Tasks (Previous Deadlines)</option>
              <option value="Completed">Completed Only</option>
            </select>
          </div>
        </div>

        {/* Quick Timeline Category Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Classification:</span>
          {(['All', 'Pending', 'Upcoming', 'Past', 'Completed'] as const).map(tab => {
            const isSelected = timelineFilter === tab;
            let count = totalCount;
            if (tab === 'Pending') count = pendingCount;
            if (tab === 'Upcoming') count = upcomingCount;
            if (tab === 'Past') count = pastCount;
            if (tab === 'Completed') count = completedCount;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setTimelineFilter(tab)}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>{tab === 'All' ? 'All Tasks' : tab === 'Pending' ? 'Pending Tasks' : tab === 'Upcoming' ? 'Upcoming Tasks' : tab === 'Past' ? 'Past Tasks' : 'Completed'}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>Showing <strong>{filteredItems.length}</strong> of {totalCount} action items</span>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">Calculated dynamically using current date</span>
        </div>
      </div>

      {/* Main Action Items List */}
      <div className="space-y-5">
        {timelineFilter === 'All' ? (
          <>
            {/* 1. Pending Tasks Section */}
            {pendingItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-amber-200 dark:border-amber-900/60">
                  <ListTodo className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pending Tasks (Current & Active)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                    {pendingItems.length} Active
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingItems.map(renderTaskCard)}
                </div>
              </div>
            )}

            {/* 2. Upcoming Tasks Section */}
            {upcomingItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-blue-200 dark:border-blue-900/60">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Upcoming Tasks (Future Deadlines)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
                    {upcomingItems.length} Scheduled
                  </span>
                </div>
                <div className="space-y-3">
                  {upcomingItems.map(renderTaskCard)}
                </div>
              </div>
            )}

            {/* 3. Past Tasks Section */}
            {pastItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <History className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Past Tasks / Previous Deadlines
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {pastItems.length} Historical
                  </span>
                </div>
                <div className="space-y-3">
                  {pastItems.map(renderTaskCard)}
                </div>
              </div>
            )}

            {filteredItems.length === 0 && (
              <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs space-y-1">
                <CheckSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No action items found matching your filters</p>
                <p className="text-slate-400 dark:text-slate-500">Try selecting "All Deadlines" or "All Participants".</p>
              </div>
            )}
          </>
        ) : (
          /* Filtered List View */
          <div className="space-y-3">
            {filteredItems.length > 0 ? (
              filteredItems.map(renderTaskCard)
            ) : (
              <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs space-y-1">
                <CheckSquare className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                <p className="font-semibold text-slate-600 dark:text-slate-300">No action items found in "{timelineFilter}"</p>
                <p className="text-slate-400 dark:text-slate-500">Try selecting "All Deadlines" to view all tasks.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
