import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii, typography, shadows } from '../theme';
import type { Platform, ScheduledPost, PublishedPost } from '../types';

type SocialPostPreviewProps = {
  post: ScheduledPost | PublishedPost;
  authorName?: string;
  authorHeadline?: string;
  avatarUrl?: string;
  platform?: Platform;
  formattedTime?: string;
  onMediaPress?: () => void;
};

export function SocialPostPreview({
  post,
  authorName = 'Alex Mercer',
  authorHeadline = 'Founder & CEO • Dexter AI',
  avatarUrl,
  platform = 'linkedin',
  formattedTime,
  onMediaPress,
}: SocialPostPreviewProps) {
  const isPublished = 'performance' in post;
  const publishedPost = isPublished ? (post as PublishedPost) : null;
  const postPlatform = publishedPost?.platform ?? platform;
  const mediaUrl = post.media_url;
  const isVideo = post.media_type === 'video';

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\s+)/);
    return (
      <Text style={styles.postBodyText}>
        {parts.map((part, i) => {
          if (part.startsWith('#') && part.length > 1) {
            return (
              <Text key={i} style={styles.hashtagText}>
                {part}
              </Text>
            );
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <View style={[styles.cardOuter, shadows.subtle]}>
      {/* Platform & Author Header */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitial}>
                {authorName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.authorInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {post.author_name || authorName}
              </Text>
              <Text style={styles.connectionDegree}>• 1st</Text>
            </View>
            <Text style={styles.authorHeadline} numberOfLines={1}>
              {post.author_headline || authorHeadline}
            </Text>
            <View style={styles.timestampRow}>
              <Text style={styles.timestamp}>
                {formattedTime ||
                  ('published_at' in post
                    ? new Date(post.published_at).toLocaleDateString()
                    : 'scheduled_for' in post
                    ? new Date(post.scheduled_for).toLocaleDateString()
                    : 'Now')}
              </Text>
              <Text style={styles.timestampDot}>•</Text>
              <Ionicons name="globe-outline" size={12} color={colors.inkFaint} />
            </View>
          </View>
        </View>

        <View style={styles.platformBadge}>
          <Ionicons
            name={
              postPlatform === 'linkedin'
                ? 'logo-linkedin'
                : postPlatform === 'instagram'
                ? 'logo-instagram'
                : 'musical-notes-outline'
            }
            size={16}
            color={postPlatform === 'linkedin' ? '#0A66C2' : colors.primary}
          />
        </View>
      </View>

      {/* Post Text */}
      <View style={styles.contentWrap}>{renderFormattedText(post.content_text)}</View>

      {/* Attached Media */}
      {mediaUrl ? (
        <Pressable style={styles.mediaContainer} onPress={onMediaPress}>
          <Image source={{ uri: mediaUrl }} style={styles.mediaImage} resizeMode="cover" />
          {isVideo && (
            <View style={styles.videoOverlay}>
              <View style={styles.playIconWrap}>
                <Ionicons name="play" size={24} color="#FFFFFF" />
              </View>
            </View>
          )}
        </Pressable>
      ) : null}

      {/* Engagement Stats Bar */}
      {publishedPost && (
        <>
          <View style={styles.engagementBar}>
            <View style={styles.reactionsCluster}>
              <View style={[styles.reactionCircle, { backgroundColor: colors.brand }]}>
                <Ionicons name="thumbs-up" size={10} color="#FFFFFF" />
              </View>
              <View style={[styles.reactionCircle, { backgroundColor: '#FF3B30', marginLeft: -4 }]}>
                <Ionicons name="heart" size={10} color="#FFFFFF" />
              </View>
              <View style={[styles.reactionCircle, { backgroundColor: '#FF9500', marginLeft: -4 }]}>
                <Ionicons name="bulb" size={10} color="#FFFFFF" />
              </View>
              <Text style={styles.reactionsCount}>
                {publishedPost.performance.likes}
              </Text>
            </View>
            <View style={styles.commentsStats}>
              <Text style={styles.statMetaText}>
                {publishedPost.performance.comments} comments • {publishedPost.performance.shares} reposts
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Social Action Bar */}
          <View style={styles.actionRow}>
            <View style={styles.socialAction}>
              <Ionicons name="thumbs-up-outline" size={15} color={colors.inkSoft} />
              <Text style={styles.actionText}>Like</Text>
            </View>
            <View style={styles.socialAction}>
              <Ionicons name="chatbubble-ellipses-outline" size={15} color={colors.inkSoft} />
              <Text style={styles.actionText}>Comment</Text>
            </View>
            <View style={styles.socialAction}>
              <Ionicons name="repeat-outline" size={16} color={colors.inkSoft} />
              <Text style={styles.actionText}>Repost</Text>
            </View>
            <View style={styles.socialAction}>
              <Ionicons name="paper-plane-outline" size={15} color={colors.inkSoft} />
              <Text style={styles.actionText}>Send</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardOuter: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.brandTint,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    ...typography.caption,
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  connectionDegree: {
    ...typography.caption2,
    color: colors.inkFaint,
  },
  authorHeadline: {
    ...typography.caption2,
    color: colors.inkSoft,
    marginTop: 1,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timestamp: {
    ...typography.caption2,
    color: colors.inkFaint,
  },
  timestampDot: {
    fontSize: 10,
    color: colors.inkFaint,
  },
  platformBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  postBodyText: {
    ...typography.callout,
    color: colors.ink,
    lineHeight: 22,
  },
  hashtagText: {
    color: colors.brand,
    fontWeight: '600',
  },
  mediaContainer: {
    marginTop: spacing.md,
    width: '100%',
    height: 220,
    backgroundColor: colors.surfaceSunken,
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 18, 16, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(28, 18, 16, 0.60)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  engagementBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  reactionsCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionCircle: {
    width: 18,
    height: 18,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactionsCount: {
    ...typography.caption,
    color: colors.inkSoft,
    fontWeight: '600',
    marginLeft: 6,
  },
  commentsStats: {
    flexDirection: 'row',
  },
  statMetaText: {
    ...typography.caption2,
    color: colors.inkFaint,
  },
  divider: {
    height: 0.5,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  socialAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  actionText: {
    ...typography.caption,
    color: colors.inkSoft,
    fontWeight: '600',
    fontSize: 12,
  },
});