import ConversionFlowPanel from './ConversionFlowPanel';

/** Lead → Student conversion on the same record */
export default function ConversionTab({ enquiry, onConvert, converting }) {
  return (
    <div className="space-y-4">
      <ConversionFlowPanel
        enquiry={enquiry}
        onConvert={onConvert}
        converting={converting}
      />
    </div>
  );
}
