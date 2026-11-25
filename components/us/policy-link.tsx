import type {ReactNode} from 'react';
import {isUsNavigationVisible} from '@/lib/us/release-gate';

/** A policy on hold remains readable in protected review, without a dead public link. */
export function UsPolicyLink({href,children}:{href:string;children:ReactNode}) {
  return isUsNavigationVisible(href)?<a className="text-primary underline" href={href}>{children}</a>:<span>{children} (publication pending)</span>;
}
