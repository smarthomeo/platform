import { ReactElement } from 'react';
import { TemplateType } from '../TemplateMessageItemBody/types';
import { MessageComponentRenderers, MessageContentProps } from './index';
type MessageContentForTemplateMessageProps = MessageContentProps & MessageComponentRenderers & {
    isByMe: boolean;
    displayThreadReplies: boolean;
    mouseHover: boolean;
    isMobile: boolean;
    isReactionEnabledInChannel: boolean;
    hoveredMenuClassName: string;
    templateType: TemplateType | null;
    useReplying: boolean;
};
export declare function MessageContentForTemplateMessage(props: MessageContentForTemplateMessageProps): ReactElement;
export {};
