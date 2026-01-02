import { Badge } from "@/components/ui/badge";


export const OrderTypeBadge = ({ type }: { type: string }) => {
const map: any = {
product: "default",
printout: "secondary",
porter: "outline",
mixed: "destructive",
};


return <Badge variant={map[type]}>{type}</Badge>;
};