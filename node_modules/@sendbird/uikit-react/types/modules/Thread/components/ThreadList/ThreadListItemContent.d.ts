import React from 'react';
import { EmojiContainer } from '@sendbird/chat';
import { GroupChannel } from '@sendbird/chat/groupChannel';
import './ThreadListItemContent.scss';
import { ReplyType } from '../../../../types';
import { SendableMessageType } from '../../../../utils';
import type { MessageComponentRenderers } from '../../../../ui/MessageContent';
export interface ThreadListItemContentProps extends MessageComponentRenderers {
    className?: string;
    userId: string;
    channel: GroupChannel;
    message: SendableMessageType;
    chainTop?: boolean;
    chainBottom?: boolean;
    isReactionEnabled?: boolean;
    disableQuoteMessage?: boolean;
    replyType?: ReplyType;
    nicknamesMap?: Map<string, string>;
    emojiContainer?: EmojiContainer;
    showEdit?: (bool: boolean) => void;
    showRemove?: (bool: boolean) => void;
    showFileViewer?: (bool: boolean) => void;
    resendMessage?: (message: SendableMessageType) => void;
    toggleReaction?: (message: SendableMessageType, reactionKey: string, isReacted: boolean) => void;
    onReplyInThread?: (props: {
        message: SendableMessageType;
    }) => void;
    /** @deprecated This prop is deprecated and no longer in use. */
    disabled?: boolean;
    /** @deprecated This props is deprecated and no longer in use. */
    isMentionEnabled?: boolean;
}
export default function ThreadListItemContent(props: ThreadListItemContentProps): React.ReactElement;
