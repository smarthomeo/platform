import React from 'react';
import '../index.scss';
import { MessageContentProps } from '../index';
export interface MessageProfileProps extends MessageContentProps {
    className?: string;
    isByMe?: boolean;
    displayThreadReplies?: boolean;
    bottom?: string;
}
export declare function MessageProfile({ className, isByMe, displayThreadReplies, bottom, message, channel, userId, chainBottom, }: MessageProfileProps): React.JSX.Element;
export default MessageProfile;
