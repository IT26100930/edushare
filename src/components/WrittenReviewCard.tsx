import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ResourceReview } from '../data/models';
import { Button } from './Button';
import { Rating } from './shared/Rating';

type WrittenReview = ResourceReview & { resourceId: string; resourceTitle: string };

/** Manage a written review directly from the profile; mutations use the shared API flow. */
export function WrittenReviewCard({ review }: { review: WrittenReview }) {
  const { updateReview, deleteReview } = useApp();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editorId = `profile-review-${review.id}`;

  const startEditing = () => {
    setRating(review.rating);
    setComment(review.comment);
    setError('');
    setConfirmingDelete(false);
    setEditing(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !comment.trim() || rating < 1 || rating > 5) return;
    setBusy(true);
    setError('');
    try {
      await updateReview(review.id, rating, comment.trim());
      setEditing(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Your review could not be updated.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await deleteReview(review.id);
      setConfirmingDelete(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Your review could not be deleted.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="border-t border-neutral-200 dark:border-neutral-700 pt-4 space-y-3" aria-label={`Your review of ${review.resourceTitle}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{review.resourceTitle}</h4>
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{review.rating} out of 5 stars</p>
        </div>
        {!editing && !confirmingDelete && (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={startEditing}>Edit Review</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => { setError(''); setConfirmingDelete(true); }}>Delete Review</Button>
          </div>
        )}
      </div>
      {!editing && <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap break-words">{review.comment}</p>}
      {editing && (
        <form onSubmit={save} className="rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 p-4 space-y-3" aria-label={`Edit your review of ${review.resourceTitle}`}>
          <div><span className="text-sm font-semibold mr-3">Your rating</span><Rating value={rating} interactive={!busy} onChange={setRating} /></div>
          <label className="block text-sm font-semibold" htmlFor={editorId}>Your review</label>
          <textarea id={editorId} value={comment} onChange={event => setComment(event.target.value)} maxLength={2000} rows={3} disabled={busy} required
            className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#283577]/30" />
          <p className="text-xs text-neutral-500">{comment.length}/2000 characters</p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={busy || !comment.trim() || rating < 1 || rating > 5}>{busy ? 'Saving...' : 'Save Review'}</Button>
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => { setEditing(false); setError(''); }}>Cancel Edit</Button>
          </div>
        </form>
      )}
      {confirmingDelete && (
        <div className="rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900/50 p-4 space-y-3" role="group" aria-label="Confirm review deletion">
          <p className="text-sm text-neutral-800 dark:text-neutral-200">Delete this review? Your rating and comment will be removed.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={remove}>{busy ? 'Deleting...' : 'Confirm Delete'}</Button>
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => { setConfirmingDelete(false); setError(''); }}>Cancel Delete</Button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <Link className="inline-block text-sm font-semibold text-[#FF4A00] hover:underline" to={`/resource/${review.resourceId}?tab=reviews`}>View resource →</Link>
    </article>
  );
}
