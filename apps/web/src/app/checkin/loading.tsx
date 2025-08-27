import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6">
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Preparing check-in page</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

