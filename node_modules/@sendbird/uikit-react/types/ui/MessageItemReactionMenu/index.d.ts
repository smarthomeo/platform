import './index.scss';
import { ReactElement } from 'react';
import type { EmojiCategory, EmojiContainer } from '@sendbird/chat';
import { SendableMessageType } from '../../utils';
import { SpaceFromTriggerType } from '../../types';
export interface MessageEmojiMenuProps {
    className?: string | Array<string>;
    message: SendableMessageType;
    userId: string;
    spaceFromTrigger?: SpaceFromTriggerType;
    emojiContainer?: EmojiContainer;
    filterEmojiCategoryIds?: (message: SendableMessageType) => EmojiCategory['id'][];
    toggleReaction?: (message: SendableMessageType, reactionKey: string, isReacted: boolean) => void;
}
export declare function MessageEmojiMenu({ className, message, userId, spaceFromTrigger, emojiContainer, filterEmojiCategoryIds, toggleReaction, }: MessageEmojiMenuProps): ReactElement | null;
export default MessageEmojiMenu;
