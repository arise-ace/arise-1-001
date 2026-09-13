import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function CategoryChart({ data, primaryColor, lineColor, inkFaintColor }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={lineColor} vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: inkFaintColor }} />
        <YAxis tick={{ fontSize: 10, fill: inkFaintColor }} allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey="count" fill={primaryColor} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
