import { Component } from '@angular/core';
//import * as XLSX from 'xlsx';

@Component({
  selector: 'app-importarafiliados',
  templateUrl: './importarafiliados.component.html',
  styleUrls: ['./importarafiliados.component.css']
})
export class ImportarafiliadosComponent {
  data: any;

  onFileChange(event: any) {
  /*  const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1) throw new Error('Cannot use multiple files');

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      this.data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      console.log(this.data);
    };
    reader.readAsBinaryString(target.files[0]);
    */
  }
}
