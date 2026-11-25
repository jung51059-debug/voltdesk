import {US_OPERATOR} from '@/lib/us/operator';
export function UsOperatorDetails(){return <p className="mt-3">Ampory is individually operated from the Republic of Korea by <span lang="ko">{US_OPERATOR.nameKo}</span>. The operator also handles privacy matters. Contact: <a className="text-primary underline" href={'mailto:'+US_OPERATOR.email}>{US_OPERATOR.email}</a>.</p>;}
