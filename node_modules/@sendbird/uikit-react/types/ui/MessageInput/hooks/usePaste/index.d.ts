import React from 'react';
import { DynamicProps } from './types';
export declare function usePaste({ ref, setIsInput, channel, setMentionedUsers, }: DynamicProps): (e: React.ClipboardEvent<HTMLDivElement>) => void;
export default usePaste;
