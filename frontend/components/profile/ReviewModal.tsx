import React, { useState } from 'react'
import { Star, X } from 'lucide-react'
import { toast } from 'sonner'
import { useSubmitReviewMutation, useUpdateReviewMutation } from '@/redux/services/profileApi'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  existingReview?: {
    rating: number
    comment: string
  }
}

export default function ReviewModal({ isOpen, onClose, productId, existingReview }: ReviewModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0)
  const [comment, setComment] = useState(existingReview?.comment || '')
  const [hoverRating, setHoverRating] = useState(0)

  const [submitReview, { isLoading: isSubmitting }] = useSubmitReviewMutation()
  const [updateReview, { isLoading: isUpdating }] = useUpdateReviewMutation()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    try {
      if (existingReview) {
        await updateReview({ productId, rating, comment }).unwrap()
        toast.success('Review updated successfully')
      } else {
        await submitReview({ productId, rating, comment }).unwrap()
        toast.success('Review submitted successfully')
      }
      onClose()
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to submit review')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-[var(--card)] w-full max-w-md rounded-2xl p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
          {existingReview ? 'Update Review' : 'Write a Review'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
              Rating
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 text-[var(--foreground)] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="What did you think about the product?"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isUpdating}
            className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isSubmitting || isUpdating
              ? 'Submitting...'
              : existingReview
              ? 'Update Review'
              : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  )
}
