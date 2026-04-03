import { Badge } from "@/components/ui/badge";

const variantMap: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  product: "default",
  printout: "secondary",
  porter: "outline",
};

export const OrderTypeBadge = ({ type, itemTypes }: { type: string; itemTypes?: string[] }) => {
  // If we have individual item types, show a badge for each
  const types = itemTypes && itemTypes.length > 0 ? itemTypes : [type];

  return (
    <div className="flex flex-wrap gap-1">
      {types.map((t) => (
        <Badge key={t} variant={variantMap[t] || "destructive"}>
          {t}
        </Badge>
      ))}
    </div>
  );
};
