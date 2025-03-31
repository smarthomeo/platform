import React from 'react';
import { SendableMessageType } from '../../../../utils';
import { MessageComponentRenderers } from '../../../../ui/MessageContent';
export interface ThreadListItemProps extends MessageComponentRenderers {
    className?: string;
    message: SendableMessageType;
    chainTop?: boolean;
    chainBottom?: boolean;
    hasSeparator?: boolean;
    renderCustomSeparator?: (props: {
        message: SendableMessageType;
    }) => React.ReactElement;
    handleScroll?: () => void;
}
export default function ThreadListItem(props: ThreadListItemProps): React.ReactElement;
