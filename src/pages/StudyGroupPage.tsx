
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Send,
  Users,
  AlertCircle,
  Loader2,
  BookOpen,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface GroupView {
  id: number;
  name: string;
  moduleCode: string;
  schedule: string;
  description: string;
  badgeColor: string;
  membersCount: number;
  joined: boolean;
  meetingUrl: string;
  canManageMeeting: boolean;
}

interface Member {
  id: number;
  name: string;
  username: string;
  avatar: string;
}

interface GroupPost {
  id: number;
  groupId: number;
  userId: number;
  authorName: string;
  message: string;
  resourceUrl: string;
  createdAt: string;
}

const cardStyle =
    'rounded-2xl border border-[#E8E2D6] ' +
    'dark:border-slate-700 bg-white dark:bg-[#1E2433] ' +
    'text-gray-900 dark:text-white shadow-sm';

const inputStyle =
    'w-full rounded-xl border border-gray-300 ' +
    'dark:border-slate-600 bg-white dark:bg-slate-800 ' +
    'text-gray-900 dark:text-white ' +
    'placeholder:text-gray-400 dark:placeholder:text-slate-400 ' +
    'px-4 py-3 focus:outline-none focus:ring-2 ' +
    'focus:ring-[#FF4A00]';

export const StudyGroupPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const groupId = Number(id);

  const [group, setGroup] = useState<GroupView | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<GroupPost[]>([]);

  const [message, setMessage] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [editingMeeting, setEditingMeeting] = useState(false);
  const [meetingSchedule, setMeetingSchedule] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load group information directly from the backend.
  const load = useCallback(async () => {
    if (!Number.isInteger(groupId) || groupId <= 0) {
      setError('Invalid study circle.');
      setLoading(false);
      return;
    }

    try {
      setError('');

      const response = await fetch(
          `/api/study-groups/${groupId}`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
      );

      if (!response.ok) {
        throw new Error('Unable to load this study circle.');
      }

      const groupData: GroupView = await response.json();
      setGroup(groupData);
      if (!editingMeeting) {
        setMeetingSchedule(groupData.schedule || 'Flexible / Online');
        setMeetingUrl(groupData.meetingUrl || '');
      }


      const memberResponse = await fetch(
          `/api/study-groups/${groupId}/members`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
      );

      if (memberResponse.ok) {
        setMembers(await memberResponse.json());
      } else {
        setMembers([]);
      }

      if (groupData.joined) {
        const postResponse = await fetch(
            `/api/study-groups/${groupId}/posts`,
            {
              credentials: 'include',
              cache: 'no-store',
            }
        );

        if (postResponse.ok) {
          setPosts(await postResponse.json());
        } else {
          setPosts([]);
        }
      } else {
        setPosts([]);
      }
    } catch (err) {
      setError(
          err instanceof Error
              ? err.message
              : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Join or leave the selected study circle.
  const toggleMembership = async () => {
    if (!group || saving) return;

    setSaving(true);

    try {
      const action = group.joined ? 'leave' : 'join';

      const response = await fetch(
          `/api/study-groups/${group.id}/${action}`,
          {
            method: group.joined ? 'DELETE' : 'POST',
            credentials: 'include',
          }
      );

      if (!response.ok) {
        throw new Error(
            'Could not update your membership. Please try again.'
        );
      }

      const updated: GroupView = await response.json();

      setGroup(updated);

      addToast({
        title: updated.joined
            ? `Joined ${updated.name}`
            : `Left ${updated.name}`,
        type: updated.joined ? 'success' : 'info',
      });

      await load();
    } catch (err) {
      addToast({
        title:
            err instanceof Error
                ? err.message
                : 'Membership update failed.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group || saving) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/study-groups/${group.id}/meeting`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: meetingSchedule.trim(), meetingUrl: meetingUrl.trim() }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Could not update meeting.');
      }
      const updated: GroupView = await response.json();
      setGroup(updated);
      setEditingMeeting(false);
      addToast({ title: 'Meeting details saved', type: 'success' });
    } catch (error) {
      addToast({ title: error instanceof Error ? error.message : 'Could not save meeting.', type: 'error' });
    } finally { setSaving(false); }
  };

  const deleteStudyCircle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!group || !group.canManageMeeting || saving || deleteConfirmation.trim() !== group.name) return;
    setSaving(true);
    setDeleteError('');
    try {
      const response = await fetch(`/api/study-groups/${group.id}`, {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationName: deleteConfirmation.trim() }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || 'Could not delete the study circle.');
      }
      setConfirmDeleteOpen(false);
      addToast({ title: 'Study circle deleted', message: 'The circle and its discussions have been removed.', type: 'success' });
      navigate('/community#study-circles', { replace: true });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not delete the study circle.');
    } finally {
      setSaving(false);
    }
  };

  // Publish a discussion post.
  const publish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !group?.joined || saving) {
      return;
    }

    if (resourceUrl.trim()) {
      try {
        const url = new URL(resourceUrl.trim());

        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('Invalid protocol');
        }
      } catch {
        addToast({
          title: 'Enter a valid website or resource URL.',
          type: 'error',
        });
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch(
          `/api/study-groups/${group.id}/posts`,
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: message.trim(),
              resourceUrl: resourceUrl.trim(),
            }),
          }
      );

      if (!response.ok) {
        throw new Error('Unable to publish your post.');
      }

      setMessage('');
      setResourceUrl('');

      addToast({
        title: 'Your post has been published!',
        type: 'success',
      });

      await load();
    } catch (err) {
      addToast({
        title:
            err instanceof Error
                ? err.message
                : 'Something went wrong.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading state.
  if (loading) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-gray-700 dark:text-gray-200">
          <Loader2 className="w-9 h-9 text-[#FF4A00] animate-spin" />
          <p>Loading study circle...</p>
        </div>
    );
  }

  // Error state.
  if (!group) {
    return (
        <div className="max-w-xl mx-auto px-6 py-20 text-center text-gray-900 dark:text-white">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />

          <h2 className="text-2xl font-bold">
            Study circle unavailable
          </h2>

          <p className="mt-3 text-gray-600 dark:text-gray-300">
            {error || 'This study circle could not be found.'}
          </p>

          <Link
              to="/community"
              className="inline-block mt-6 rounded-full bg-[#FF4A00] text-white px-6 py-3 font-semibold"
          >
            Back to Community
          </Link>
        </div>
    );
  }

  return (
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-7 text-gray-900 dark:text-white">
        {confirmDeleteOpen && group.canManageMeeting && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 px-4" role="presentation">
            <div role="dialog" aria-modal="true" aria-labelledby="delete-circle-title"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1E2433]">
              <h2 id="delete-circle-title" className="text-xl font-bold text-red-700 dark:text-red-300">Delete study circle?</h2>
              <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">
                This action cannot be undone. All members and group messages will be removed.
                Your uploaded study resources and accounts are not affected.
              </p>
              <form onSubmit={deleteStudyCircle} className="mt-5 space-y-4">
                <label className="block text-sm font-semibold" htmlFor="confirm-circle-name">
                  Type <span className="font-extrabold">{group.name}</span> to confirm
                </label>
                <input id="confirm-circle-name" autoFocus autoComplete="off" required value={deleteConfirmation}
                  onChange={event => setDeleteConfirmation(event.target.value)} className={inputStyle}
                  placeholder="Exact group name" />
                {deleteError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
                <div className="flex flex-wrap justify-end gap-3">
                  <button type="button" disabled={saving} onClick={() => { setConfirmDeleteOpen(false); setDeleteConfirmation(''); }}
                    className="rounded-full border border-gray-300 px-5 py-2 font-semibold text-gray-800 dark:text-white">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || deleteConfirmation.trim() !== group.name}
                    className="rounded-full bg-red-600 px-5 py-2 font-bold text-white disabled:opacity-50">
                    {saving ? 'Deleting...' : 'Delete permanently'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* Back navigation */}
        <Link
            to="/community"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-[#FF4A00] dark:hover:text-orange-400"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Community
        </Link>

        {/* Group header */}
        <section className="rounded-[28px] bg-[#263577] text-white p-7 sm:p-10 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">

            <div>
              <div className="text-sm font-bold text-orange-300 mb-2">
                #{group.moduleCode}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
                {group.name}
              </h1>

              <p className="text-white/85 max-w-3xl text-base sm:text-lg">
                {group.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/85">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {group.schedule}
              </span>

                <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                  {group.membersCount} members
              </span>
              </div>
            </div>

            <button
                onClick={toggleMembership}
                disabled={saving}
                className={`px-6 py-3 rounded-full font-bold shrink-0 transition-all duration-200 disabled:opacity-50 ${
                    group.joined
                        ? 'bg-white text-[#263577] hover:bg-gray-100'
                        : 'bg-[#FF4A00] text-white hover:bg-[#E64500]'
                }`}
            >
              {saving
                  ? 'Please wait...'
                  : group.joined
                      ? 'Leave Group'
                      : 'Join Group'}
            </button>
          </div>
        </section>

        {/* Error notice */}
        {error && (
            <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900 p-4 text-red-700 dark:text-red-300"
            >
              {error}
            </div>
        )}

        {/* Not joined: show invitation card */}
        {!group.joined ? (
            <div
                className={`${cardStyle} p-10 text-center transition-colors duration-300`}
            >
              <Users className="w-10 h-10 mx-auto mb-4 text-[#FF4A00]" />

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Join this study circle to participate
              </h2>

              <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
                Members can view discussions, share EduShare
                resource links, and follow the meeting schedule.
              </p>

              <button
                  onClick={toggleMembership}
                  disabled={saving}
                  className="mt-6 px-6 py-3 rounded-full bg-[#FF4A00] text-white font-bold hover:bg-[#E64500] disabled:opacity-50"
              >
                {saving ? 'Joining...' : 'Join Study Circle'}
              </button>
            </div>
        ) : (

            /* Joined members: discussion and sidebar */
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">

              {/* Main discussion column */}
              <div className="space-y-5">

                {/* Create post */}
                <form
                    onSubmit={publish}
                    className={`${cardStyle} p-5 space-y-4`}
                >
                  <h2 className="font-extrabold text-lg flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#FF4A00]" />
                    Post to the group
                  </h2>

                  <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      maxLength={3000}
                      required
                      placeholder="Ask a question, share an update, or post a study tip..."
                      className={inputStyle}
                  />

                  <input
                      type="url"
                      value={resourceUrl}
                      onChange={(e) => setResourceUrl(e.target.value)}
                      placeholder="Optional resource link (https://...)"
                      className={inputStyle}
                  />

                  <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving || !message.trim()}
                        className="px-6 py-3 rounded-full bg-[#FF4A00] text-white font-bold hover:bg-[#E64500] transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Publishing...' : 'Publish Post'}
                    </button>
                  </div>
                </form>

                {/* Discussion posts */}
                <div className="space-y-3">
                  {posts.length === 0 ? (
                      <div className={`${cardStyle} p-10 text-center`}>
                        <BookOpen className="w-9 h-9 mx-auto mb-3 text-[#FF4A00]" />

                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                          No discussions yet
                        </h3>

                        <p className="mt-2 text-gray-600 dark:text-gray-300">
                          Be the first to ask a question or share a study tip.
                        </p>
                      </div>
                  ) : (
                      posts.map((post) => (
                          <article
                              key={post.id}
                              className={`${cardStyle} p-5`}
                          >
                            <div className="flex justify-between gap-3 flex-wrap">
                              <div className="font-bold text-gray-900 dark:text-white">
                                {post.authorName}
                              </div>

                              <span className="text-xs text-gray-500 dark:text-gray-400">
                        {post.createdAt}
                      </span>
                            </div>

                            <p className="mt-3 text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                              {post.message}
                            </p>

                            {post.resourceUrl && (
                                <a
                                    href={post.resourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Open shared resource
                                </a>
                            )}
                          </article>
                      ))
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <aside className="space-y-5">

                {/* Meeting schedule */}
                <div className={`${cardStyle} p-5`}>
                  <h3 className="font-extrabold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#FF4A00]" />
                    Meeting Schedule
                  </h3>

                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {group.schedule}
                  </p>
                  {group.meetingUrl && group.joined && (
                    <a href={group.meetingUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#263577] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1d2a61]">
                      <ExternalLink className="w-4 h-4" /> Join Meeting
                    </a>
                  )}
                  {group.canManageMeeting && (
                    <div className="mt-4">
                      <button type="button" onClick={() => setEditingMeeting(!editingMeeting)}
                        className="text-sm font-bold text-[#FF4A00] hover:underline">
                        {editingMeeting ? 'Cancel editing' : 'Edit meeting details'}
                      </button>
                      {editingMeeting && (
                        <form onSubmit={saveMeeting} className="mt-3 space-y-3">
                          <label className="block text-xs font-semibold">Schedule</label>
                          <input required maxLength={80} value={meetingSchedule} onChange={e => setMeetingSchedule(e.target.value)}
                            className={inputStyle} placeholder="Saturday, 7:00 PM (Online)" />
                          <label className="block text-xs font-semibold">Meeting link (optional)</label>
                          <input type="url" maxLength={500} value={meetingUrl} onChange={e => setMeetingUrl(e.target.value)}
                            className={inputStyle} placeholder="https://meet.google.com/..." />
                          <button disabled={saving} type="submit"
                            className="rounded-lg bg-[#FF4A00] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                            {saving ? 'Saving...' : 'Save Meeting'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>

                {group.canManageMeeting && (
                  <div className={`${cardStyle} p-5 border-red-200 dark:border-red-800`}>
                    <h3 className="font-extrabold text-red-700 dark:text-red-400 flex items-center gap-2">
                      <Trash2 className="w-5 h-5" /> Manage Study Circle
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      Deleting this circle permanently removes its members and discussion posts.
                      Uploaded resources and user accounts are not deleted.
                    </p>
                    <button type="button" onClick={() => { setDeleteError(''); setDeleteConfirmation(''); setConfirmDeleteOpen(true); }}
                      className="mt-3 rounded-xl border border-red-600 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/30">
                      Delete Study Circle
                    </button>
                  </div>
                )}

                {/* Group members */}
                <div className={`${cardStyle} p-5`}>
                  <h3 className="font-extrabold flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#FF4A00]" />
                    Members ({group.membersCount})
                  </h3>

                  <div className="mt-4 space-y-4">
                    {members.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No members to display yet.
                        </p>
                    ) : (
                        members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-3"
                            >
                              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                {member.avatar ? (
                                    <img
                                        src={member.avatar}
                                        alt={`${member.name}'s avatar`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="font-bold text-[#FF4A00]">
                            {member.name.charAt(0)}
                          </span>
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                  {member.name}
                                </div>

                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  @{member.username}
                                </div>
                              </div>
                            </div>
                        ))
                    )}
                  </div>
                </div>
              </aside>
            </div>
        )}
      </div>
  );
};
